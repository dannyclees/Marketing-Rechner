import { ACHIEVABLE_SHARE, CHANNEL_SHARE, type Industry } from "./benchmarks";
import type { SiteSignals } from "./checks/crawl";
import type { PageSpeed } from "./checks/pagespeed";
import type { AdsResult, MapsResult, SerpResult } from "./checks/google";
import type { MetaAdsResult } from "./checks/meta";
import type { CategoryId, CategoryScore, Check, Finding, FullReport, Potential, Status } from "./types";

export interface ScanInput {
  company: string;
  domain: string;
  industry: Industry;
  site: SiteSignals;
  pagespeed: PageSpeed | null;
  googleAds: AdsResult | null;
  metaAds: MetaAdsResult | null;
  ranking: SerpResult | null;
  maps: MapsResult | null;
}

const CATEGORY_LABELS: Record<CategoryId, string> = {
  kampagnen: "Kampagnen & Reichweite",
  funnel: "Funnel & Landingpages",
  tracking: "Tracking & Retargeting",
  vertrauen: "Sichtbarkeit & Vertrauen",
  website: "Website & Ladezeit",
  luxemburg: "Luxemburg-Fit",
};

const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  kampagnen: 25,
  funnel: 25,
  tracking: 20,
  vertrauen: 12,
  website: 10,
  luxemburg: 8,
};

const STATUS_POINTS: Record<Status, number | null> = { good: 1, warn: 0.5, bad: 0, unknown: null };

const fmt = (n: number) => n.toLocaleString("de-LU");

export function analyze(input: ScanInput): FullReport {
  const { site, pagespeed, googleAds, metaAds, ranking, maps, industry } = input;
  const checks: Check[] = [];
  const findings: Finding[] = [];
  const add = (c: Check) => checks.push(c);
  const find = (f: Finding) => findings.push(f);
  const t = site.tracking;

  // ---------- Kampagnen & Reichweite ----------
  const metaRunning = metaAds ? metaAds.running : null;
  add({
    id: "metaads",
    category: "kampagnen",
    label: "Meta Ads (Facebook & Instagram)",
    status: metaRunning ? "good" : metaRunning === null && t.metaPixel ? "warn" : "bad",
    value: metaRunning
      ? `Aktiv (${metaAds!.ads} Anzeigen in Luxemburg)`
      : metaRunning === false
        ? "Keine aktiven Anzeigen in Luxemburg"
        : t.metaPixel
          ? "Pixel vorhanden, Anzeigen nicht bestätigt"
          : "Keine Hinweise auf Meta Ads",
  });

  const googleRunning = googleAds ? googleAds.running : ranking?.paidVisible ? true : null;
  add({
    id: "googleads",
    category: "kampagnen",
    label: "Google Ads",
    status: googleRunning ? "good" : googleRunning === null && t.googleAdsTag ? "warn" : "bad",
    value: googleRunning
      ? googleAds
        ? `Aktiv (${googleAds.creatives} Anzeigen in Luxemburg)`
        : "Aktiv"
      : googleRunning === false
        ? "Keine aktiven Anzeigen in Luxemburg"
        : t.googleAdsTag
          ? "Ads-Tag vorhanden, Anzeigen nicht bestätigt"
          : "Keine Hinweise auf Google Ads",
  });

  const channels = [metaRunning, googleRunning].filter(Boolean).length;
  if (channels === 0) {
    find({
      id: "kampagnen",
      category: "kampagnen",
      severity: "high",
      title: "Kein planbarer Kundenstrom: keine aktiven Kampagnen",
      detail: `Weder auf Facebook/Instagram noch bei Google laufen aktuell Anzeigen in Luxemburg. Neue Kunden kommen damit nur über Empfehlungen und Zufall. Das ist weder planbar noch skalierbar, während Mitbewerber${
        ranking?.competitorsWithAds ? ` (allein ${ranking.competitorsWithAds} auf Google bei „${industry.keyword}“)` : ""
      } sich die Kaufinteressenten aktiv holen.`,
      recommendation:
        "Ein Performance-System aufbauen statt einzelne Werbeanzeigen: Meta Ads, um Kaufinteressenten in Luxemburg anzusprechen, bevor sie sich für einen Anbieter entschieden haben, und Google Ads für alle, die bereits aktiv suchen. Gesteuert wird nach Kosten pro qualifizierter Anfrage, nicht nach Klicks oder Reichweite.",
    });
  } else if (channels === 1) {
    find({
      id: "kampagnen",
      category: "kampagnen",
      severity: "medium",
      title: `Nur auf einem Kanal aktiv (${metaRunning ? "Meta" : "Google"})`,
      detail: metaRunning
        ? "Du sprichst Interessenten auf Facebook/Instagram an, aber wer aktiv bei Google sucht, findet über Anzeigen nur deine Konkurrenz."
        : "Du erreichst nur Menschen, die schon aktiv suchen. Die viel größere Gruppe, die noch nicht sucht, aber kaufen würde, erreichst du über Meta Ads nicht.",
      recommendation:
        "Beide Kanäle als ein System aufsetzen: Meta erzeugt Nachfrage und Retargeting-Zielgruppen, Google fängt die aktive Suche ab. Gemeinsam gemessen über Kosten pro Anfrage und Abschluss.",
    });
  }

  // ---------- Funnel & Landingpages ----------
  add({
    id: "offer",
    category: "funnel",
    label: "Klares Einstiegsangebot",
    status: site.hasOffer ? "good" : "bad",
    value: site.hasOffer ? "Vorhanden" : "Nicht gefunden",
  });
  if (!site.hasOffer) {
    find({
      id: "offer",
      category: "funnel",
      severity: "high",
      title: "Kein Einstiegsangebot: Interessenten bleiben anonym",
      detail:
        "Bei hochpreisigen Leistungen entscheidet sich niemand beim ersten Besuch. Ohne niedrigschwelligen Einstieg (z. B. kostenlose Erstberatung, Analyse oder Bewertung) verlässt der Großteil deiner Besucher die Seite, ohne dass du je erfährst, wer sie waren.",
      recommendation:
        "Ein starkes Einstiegsangebot entwickeln, das für den Kunden einen echten Wert hat (z. B. kostenlose Analyse, Wertermittlung oder Planungsgespräch), und alle Kampagnen genau darauf ausrichten, mit Qualifizierungsfragen, damit nur passende Anfragen ankommen.",
    });
  }

  add({
    id: "landing",
    category: "funnel",
    label: "Eigene Landingpages",
    status: site.landingPages >= 2 ? "good" : site.landingPages === 1 ? "warn" : "bad",
    value: site.landingPages ? `${site.landingPages} gefunden` : "Keine gefunden",
  });
  if (site.landingPages < 2) {
    find({
      id: "landing",
      category: "funnel",
      severity: site.landingPages ? "medium" : "high",
      title: site.landingPages ? "Nur eine Landingpage für deine Angebote" : "Keine Landingpages: Werbebudget würde verpuffen",
      detail:
        "Besucher aus Kampagnen landen auf der allgemeinen Startseite statt auf einer Seite, die genau ein Angebot verkauft. Das kostet typischerweise 50 % und mehr der möglichen Anfragen und macht jede Anfrage entsprechend teurer.",
      recommendation:
        "Pro Hauptangebot eine fokussierte Landingpage: klares Versprechen, Referenzen und Ergebnisse, Ablauf, Einwände und FAQ, genau ein Call-to-Action. Danach laufend A/B-testen.",
    });
  }

  add({
    id: "form",
    category: "funnel",
    label: "Anfrage-Formular / Online-Termin",
    status: site.hasForm || site.hasBooking ? "good" : "bad",
    value: site.hasBooking ? "Online-Terminbuchung" : site.hasForm ? "Formular vorhanden" : "Fehlt",
  });
  add({
    id: "cta",
    category: "funnel",
    label: "Klare Handlungsaufforderungen",
    status: site.ctaCount >= 3 ? "good" : site.ctaCount >= 1 ? "warn" : "bad",
    value: `${site.ctaCount} gefunden`,
  });
  add({
    id: "phone",
    category: "funnel",
    label: "Klickbare Telefonnummer",
    status: site.hasTelLink ? "good" : "warn",
    value: site.hasTelLink ? "Ja" : "Nein",
  });
  if (!(site.hasForm || site.hasBooking) || site.ctaCount < 3) {
    find({
      id: "conversion",
      category: "funnel",
      severity: site.hasForm || site.hasBooking ? "medium" : "high",
      title: site.hasForm || site.hasBooking ? "Zu wenige Handlungsaufforderungen" : "Besucher können dich kaum direkt anfragen",
      detail:
        site.hasForm || site.hasBooking
          ? `Nur ${site.ctaCount} klare Handlungsaufforderung(en) gefunden. Interessenten wissen nicht, was sie als Nächstes tun sollen.`
          : "Kein Anfrage-Formular und keine Online-Terminbuchung gefunden. Jeder Interessent muss aktiv anrufen oder eine Mail schreiben, und die meisten tun das nicht.",
      recommendation: "Kurzes Qualifizierungs-Formular (3–5 Felder) oder direkte Terminbuchung, dazu ein sichtbarer Button in jedem Abschnitt der Seite.",
    });
  }

  // ---------- Tracking & Retargeting ----------
  add({
    id: "analytics",
    category: "tracking",
    label: "Google Analytics / Tag Manager",
    status: t.ga4 || t.gtm ? "good" : "bad",
    value: [t.ga4 && "GA4", t.gtm && "GTM"].filter(Boolean).join(" + ") || "Nicht gefunden",
  });
  const adPixels = [t.metaPixel && "Meta Pixel", t.googleAdsTag && "Google Ads", t.linkedin && "LinkedIn", t.tiktok && "TikTok"].filter(Boolean);
  add({
    id: "pixels",
    category: "tracking",
    label: "Conversion-Tracking & Retargeting-Pixel",
    status: adPixels.length >= 2 ? "good" : adPixels.length === 1 || t.gtm ? "warn" : "bad",
    value: adPixels.join(", ") || (t.gtm ? "Evtl. über GTM, nicht sichtbar" : "Nicht gefunden"),
  });
  if (adPixels.length === 0) {
    find({
      id: "tracking",
      category: "tracking",
      severity: "high",
      title: "Kein Conversion-Tracking: Marketing läuft im Blindflug",
      detail:
        "Ohne Meta Pixel und Conversion-Tracking weißt du nicht, welche Maßnahme Anfragen und Umsatz bringt, und die Werbe-Algorithmen können nicht auf echte Kunden optimieren. Dazu gehen alle Besucher verloren, die nicht sofort anfragen. Bei teuren Angeboten mit langer Entscheidungszeit ist das der Großteil.",
      recommendation:
        "Sauberes Tracking-Fundament: Tag Manager, GA4, Meta Pixel inkl. Conversions API und Google-Ads-Conversions, DSGVO-konform mit Consent-Banner. Danach Retargeting-Kampagnen, die Besucher über Wochen hinweg zurückholen.",
    });
  } else if (!t.metaPixel) {
    find({
      id: "tracking",
      category: "tracking",
      severity: "medium",
      title: "Kein Meta Pixel: kein Retargeting auf Facebook & Instagram",
      detail: "Besucher, die nicht sofort anfragen, kannst du auf Facebook und Instagram nicht erneut ansprechen, obwohl dort die meisten von ihnen täglich unterwegs sind.",
      recommendation: "Meta Pixel inkl. Conversions API einrichten und Retargeting-Kampagnen mit Referenzen und Kundenstimmen aufsetzen.",
    });
  }

  // ---------- Sichtbarkeit & Vertrauen ----------
  if (ranking) {
    const pos = ranking.organicPosition;
    add({
      id: "ranking",
      category: "vertrauen",
      label: `Google-Ranking „${industry.keyword}“`,
      status: pos && pos <= 3 ? "good" : pos && pos <= 10 ? "warn" : "bad",
      value: pos ? `Position ${pos}` : "Nicht in den Top 20",
    });
    if (!pos || pos > 10) {
      find({
        id: "ranking",
        category: "vertrauen",
        severity: "medium",
        title: pos ? `Bei Google nur auf Platz ${pos}` : "Bei Google für deine Branche nicht auffindbar",
        detail: `Wer in Luxemburg nach „${industry.keyword}“ sucht, findet dich ${pos ? "erst auf Seite 2" : "auf den ersten zwei Seiten gar nicht"}. Diese Nachfrage geht komplett an Mitbewerber.`,
        recommendation: "Kurzfristig über Google Ads abfangen, mittelfristig mit mehrsprachigen Angebotsseiten organisch aufbauen.",
      });
    }
  } else {
    const seoBasics = [site.title.length > 10, site.metaDescription.length > 50, site.h1Count === 1, site.hasStructuredData, site.sitemapUrls !== null].filter(Boolean).length;
    add({
      id: "seo",
      category: "vertrauen",
      label: "SEO-Grundlagen",
      status: seoBasics >= 4 ? "good" : seoBasics >= 2 ? "warn" : "bad",
      value: `${seoBasics} von 5 Basics erfüllt`,
    });
  }

  if (maps) {
    const strong = maps.found && (maps.rating ?? 0) >= 4.5 && (maps.reviews ?? 0) >= 50;
    const medium = maps.found && (maps.reviews ?? 0) >= 10 && (maps.rating ?? 0) >= 4;
    add({
      id: "maps",
      category: "vertrauen",
      label: "Google-Bewertungen",
      status: strong ? "good" : medium ? "warn" : "bad",
      value: maps.found ? `${maps.rating?.toLocaleString("de-LU") ?? "–"} ★ · ${maps.reviews ?? 0} Bewertungen` : "Kein Profil gefunden",
    });
    if (!strong) {
      find({
        id: "maps",
        category: "vertrauen",
        severity: "medium",
        title: maps.found ? "Zu wenig Social Proof bei Google" : "Kein Google-Unternehmensprofil gefunden",
        detail: maps.found
          ? `Bevor jemand eine größere Investition tätigt, prüft er dich. Mit ${maps.reviews ?? 0} Bewertungen (${maps.rating?.toLocaleString("de-LU") ?? "–"} ★) verlierst du diesen Vergleich gegen Anbieter mit 50+ Bewertungen, auch wenn deine Kampagnen funktionieren.`
          : "Wer dich nach einer Anzeige googelt, findet kein Profil und keine Bewertungen. Das kostet Vertrauen genau im entscheidenden Moment.",
        recommendation: "Systematisch Bewertungen nach jedem Auftrag einholen (automatisiert) und die besten Stimmen direkt in Anzeigen und Landingpages einsetzen.",
      });
    }
  }

  // ---------- Website ----------
  add({ id: "https", category: "website", label: "Sichere Verbindung (HTTPS)", status: site.https ? "good" : "bad", value: site.https ? "Aktiv" : "Fehlt" });
  if (!site.https) {
    find({
      id: "https",
      category: "website",
      severity: "high",
      title: "Deine Website gilt als „nicht sicher“",
      detail: "Browser zeigen bei deiner Seite eine Sicherheitswarnung an. Viele Besucher springen dann sofort ab, und jeder bezahlte Klick ist verloren.",
      recommendation: "SSL-Zertifikat aktivieren (meist kostenlos beim Hoster) und alle Seiten auf HTTPS umleiten.",
    });
  }
  add({ id: "mobile", category: "website", label: "Für Smartphones optimiert", status: site.hasViewport ? "good" : "bad", value: site.hasViewport ? "Ja" : "Nein" });

  if (pagespeed) {
    const lcp = (pagespeed.lcpMs / 1000).toFixed(1).replace(".", ",");
    add({
      id: "speed",
      category: "website",
      label: "Ladezeit mobil (Google PageSpeed)",
      status: pagespeed.performance >= 80 ? "good" : pagespeed.performance >= 50 ? "warn" : "bad",
      value: `${pagespeed.performance}/100 · ${lcp} s`,
    });
    if (pagespeed.performance < 50) {
      find({
        id: "speed",
        category: "website",
        severity: "medium",
        title: `Langsame mobile Website (${lcp} Sekunden)`,
        detail: `Über 80 % der Klicks aus Social-Media-Kampagnen kommen vom Smartphone. Bei ${lcp} s Ladezeit springt ein großer Teil ab, bevor die Seite überhaupt sichtbar ist. Du bezahlst diese Klicks trotzdem.`,
        recommendation: "Landingpages auf Geschwindigkeit bauen: komprimierte Bilder (WebP), minimale Skripte, Caching. Ziel: unter 2,5 s.",
      });
    }
  } else {
    add({
      id: "speed",
      category: "website",
      label: "Ladezeit (Server-Antwort)",
      status: site.loadMs < 1500 ? "good" : site.loadMs < 3500 ? "warn" : "bad",
      value: `${(site.loadMs / 1000).toFixed(1).replace(".", ",")} s`,
    });
  }

  // ---------- Luxemburg ----------
  const langs = site.languages;
  const hasFr = langs.includes("fr");
  const langCount = ["fr", "de", "en"].filter((l) => langs.includes(l)).length;
  add({
    id: "languages",
    category: "luxemburg",
    label: "Sprachen (FR / DE / EN)",
    status: langCount >= 2 && hasFr ? (langCount === 3 ? "good" : "warn") : "bad",
    value: langs.length ? langs.map((l) => l.toUpperCase()).join(" / ") : "Nur eine Sprache erkannt",
  });
  if (langCount < 2 || !hasFr) {
    find({
      id: "languages",
      category: "luxemburg",
      severity: "medium",
      title: "Deine Website spricht nicht die Sprachen deiner Kunden",
      detail: `Luxemburg ist mehrsprachig: Französisch, Deutsch und Englisch (Expats und Grenzgänger). ${
        langs.length ? `Erkannt wurde nur: ${langs.map((l) => l.toUpperCase()).join(", ")}.` : "Es wurde nur eine Sprache erkannt."
      } Kampagnen können damit nur einen Teil des Marktes sinnvoll ansprechen.`,
      recommendation: "Landingpages und Anzeigen in FR + DE (idealerweise EN) und Zielgruppen nach Sprache getrennt aussteuern.",
    });
  }
  add({
    id: "luxphone",
    category: "luxemburg",
    label: "Luxemburger Telefonnummer (+352)",
    status: site.hasLuxPhone ? "good" : "warn",
    value: site.hasLuxPhone ? "Ja" : "Nicht gefunden",
  });

  // ---------- Scores ----------
  const categories: CategoryScore[] = (Object.keys(CATEGORY_LABELS) as CategoryId[]).map((id) => {
    const pts = checks.filter((c) => c.category === id).map((c) => STATUS_POINTS[c.status]).filter((p): p is number => p !== null);
    return { id, label: CATEGORY_LABELS[id], score: pts.length ? Math.round((pts.reduce((a, b) => a + b, 0) / pts.length) * 100) : null };
  });
  let wSum = 0;
  let sSum = 0;
  for (const c of categories) {
    if (c.score === null) continue;
    wSum += CATEGORY_WEIGHTS[c.id];
    sSum += CATEGORY_WEIGHTS[c.id] * c.score;
  }
  const score = Math.round(wSum ? sSum / wSum : 0);
  const catScore = (id: CategoryId, fallback: number) => categories.find((c) => c.id === id)?.score ?? fallback;

  // ---------- Potenzial ----------
  const assumptions: string[] = [
    `Erkannte Branche: ${industry.label}. Geschätzte Nachfrage: ca. ${fmt(industry.monthlySearches)} Kaufinteressenten pro Monat in ganz Luxemburg (Google-Suchen FR/DE/EN), zusätzlich Reichweite über Meta Ads.`,
    `Ein optimal aufgestelltes Unternehmen erreicht ca. ${ACHIEVABLE_SHARE} % davon (Meta Ads, Google Ads, Top-Ranking, starke Bewertungen).`,
    `Branchenübliche Anfragequote eines optimierten Funnels: ${(industry.conversionRate * 100).toFixed(1).replace(".", ",")} % der erreichten Interessenten.`,
  ];

  let organic: number;
  if (ranking) {
    const p = ranking.organicPosition;
    organic = p && p <= 3 ? CHANNEL_SHARE.organicTop3 : p && p <= 10 ? CHANNEL_SHARE.organicTop10 : CHANNEL_SHARE.organicNone;
  } else {
    organic = CHANNEL_SHARE.organicNone + (catScore("vertrauen", 30) / 100) * (CHANNEL_SHARE.organicTop10 - CHANNEL_SHARE.organicNone);
  }
  let mapsShare: number = CHANNEL_SHARE.mapsMedium;
  if (maps) {
    const r = maps.rating ?? 0;
    const n = maps.reviews ?? 0;
    mapsShare = !maps.found ? CHANNEL_SHARE.mapsNone : r >= 4.5 && n >= 50 ? CHANNEL_SHARE.mapsStrong : n >= 10 && r >= 4 ? CHANNEL_SHARE.mapsMedium : CHANNEL_SHARE.mapsWeak;
  }
  const currentShare = Math.min(organic + (googleRunning ? CHANNEL_SHARE.ads : 0) + (metaRunning ? CHANNEL_SHARE.meta : 0) + mapsShare, ACHIEVABLE_SHARE);

  // Funnel-Qualität bestimmt, wie viele Besucher zu Anfragen werden.
  const quality = (catScore("funnel", 50) * 2 + catScore("website", 50) + catScore("tracking", 50)) / 400;
  const crNow = industry.conversionRate * (0.3 + 0.7 * quality);

  const S = industry.monthlySearches;
  const currentLeads = S * (currentShare / 100) * crNow;
  const achievableLeads = S * (ACHIEVABLE_SHARE / 100) * industry.conversionRate;
  const lostLeads = Math.max(0, achievableLeads - currentLeads);

  const potential: Potential = {
    monthlySearches: S,
    currentSharePct: round1(currentShare),
    achievableSharePct: ACHIEVABLE_SHARE,
    missedPeopleMonth: roundPeople(S * ((ACHIEVABLE_SHARE - currentShare) / 100)),
    currentLeadsMonth: round1(currentLeads),
    achievableLeadsMonth: round1(achievableLeads),
    lostLeadsMonth: Math.round(lostLeads),
    lostLeadsYear: Math.round(lostLeads) * 12,
    potentialPercent: Math.min(95, Math.max(5, Math.round((lostLeads / achievableLeads) * 100))),
  };

  const order = { high: 0, medium: 1, low: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    company: input.company,
    domain: input.domain,
    url: site.finalUrl,
    industryId: industry.id,
    industryLabel: industry.label,
    keyword: industry.keyword,
    scannedAt: new Date().toISOString(),
    score,
    categories,
    checks,
    findings,
    potential,
    assumptions,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const roundPeople = (n: number) => (n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10);
