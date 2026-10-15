import { ACHIEVABLE_SHARE, CHANNEL_SHARE, type Industry } from "./benchmarks";
import type { SiteSignals } from "./checks/crawl";
import type { PageSpeed } from "./checks/pagespeed";
import type { AdsResult, MapsResult, SerpResult } from "./checks/google";
import type { CategoryId, CategoryScore, Check, Finding, FullReport, Potential, Status } from "./types";

export interface ScanInput {
  company: string;
  domain: string;
  url: string;
  industry: Industry;
  dealValue?: number;
  site: SiteSignals;
  pagespeed: PageSpeed | null;
  ads: AdsResult | null;
  ranking: SerpResult | null;
  maps: MapsResult | null;
}

const CATEGORY_LABELS: Record<CategoryId, string> = {
  sichtbarkeit: "Sichtbarkeit bei Google",
  website: "Website & Ladezeit",
  conversion: "Anfragen-Maschine",
  tracking: "Tracking & Messbarkeit",
  luxemburg: "Luxemburg-Fit",
};

const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  sichtbarkeit: 35,
  website: 20,
  conversion: 25,
  tracking: 10,
  luxemburg: 10,
};

const STATUS_POINTS: Record<Status, number | null> = { good: 1, warn: 0.5, bad: 0, unknown: null };

const fmt = (n: number) => n.toLocaleString("de-LU");

export function analyze(input: ScanInput): FullReport {
  const { site, pagespeed, ads, ranking, maps, industry } = input;
  const checks: Check[] = [];
  const findings: Finding[] = [];
  const add = (c: Check) => checks.push(c);
  const find = (f: Finding) => findings.push(f);

  // ---------- Sichtbarkeit ----------
  const adsRunning = ads ? ads.running : ranking?.paidVisible ? true : null;
  add({
    id: "ads",
    category: "sichtbarkeit",
    label: "Google Ads in Luxemburg",
    status: adsRunning === true ? "good" : adsRunning === false ? "bad" : site.tracking.googleAdsTag ? "warn" : "bad",
    value:
      adsRunning === true
        ? ads
          ? `Aktiv (${ads.creatives} Anzeigen gefunden)`
          : "Aktiv"
        : adsRunning === false
          ? "Keine aktiven Anzeigen gefunden"
          : site.tracking.googleAdsTag
            ? "Ads-Tag vorhanden, Anzeigen nicht bestätigt"
            : "Keine Hinweise auf Google Ads",
  });
  if (adsRunning !== true) {
    find({
      id: "ads",
      category: "sichtbarkeit",
      severity: "high",
      title: "Du schaltest keine Google Ads in Luxemburg",
      detail: `Wer jetzt bei Google nach „${industry.keyword || industry.label}“ sucht, landet bei deiner Konkurrenz. Ganz oben stehen bei Google die Anzeigen, und dort bist du nicht.${
        ranking?.competitorsWithAds ? ` Aktuell schalten ${ranking.competitorsWithAds} Mitbewerber Anzeigen auf genau diese Suche.` : ""
      }`,
      recommendation:
        "Starte eine Google-Ads-Suchkampagne auf kaufbereite Keywords (FR + DE) mit eigener Landingpage und Conversion-Tracking. Bei hochpreisigen Angeboten reichen wenige Abschlüsse, damit sich das Budget mehrfach zurückzahlt.",
    });
  }

  if (ranking) {
    const pos = ranking.organicPosition;
    add({
      id: "ranking",
      category: "sichtbarkeit",
      label: `Google-Ranking „${industry.keyword}“`,
      status: pos && pos <= 3 ? "good" : pos && pos <= 10 ? "warn" : "bad",
      value: pos ? `Position ${pos}` : "Nicht in den Top 20",
    });
    if (!pos || pos > 3) {
      find({
        id: "ranking",
        category: "sichtbarkeit",
        severity: pos && pos <= 10 ? "medium" : "high",
        title: pos ? `Nur Platz ${pos} bei Google.lu` : "Bei Google.lu für deine Branche unsichtbar",
        detail: pos
          ? `Die ersten 3 Plätze bekommen über 60 % aller Klicks. Auf Platz ${pos} geht der Großteil der Suchenden an dir vorbei.`
          : `Für „${industry.keyword}“ tauchst du auf den ersten zwei Google-Seiten nicht auf. Diese Suchenden findest du nur über Anzeigen.`,
        recommendation:
          "Baue für dein Hauptangebot eine eigene, mehrsprachige Seite mit klarer Keyword-Ausrichtung auf und kombiniere sie kurzfristig mit Google Ads, bis die organischen Rankings greifen.",
      });
    }
  } else {
    const seoBasics = [site.title.length > 10, site.metaDescription.length > 50, site.h1Count === 1, site.hasStructuredData, site.sitemapUrls !== null].filter(Boolean).length;
    add({
      id: "seo",
      category: "sichtbarkeit",
      label: "SEO-Grundlagen",
      status: seoBasics >= 4 ? "good" : seoBasics >= 2 ? "warn" : "bad",
      value: `${seoBasics} von 5 Basics erfüllt`,
    });
    if (seoBasics < 4) {
      find({
        id: "seo",
        category: "sichtbarkeit",
        severity: "medium",
        title: "SEO-Grundlagen fehlen",
        detail: `Nur ${seoBasics} von 5 technischen SEO-Basics sind erfüllt (Title, Meta-Description, H1, strukturierte Daten, Sitemap). Google versteht deine Seite dadurch schlechter.`,
        recommendation: "Title, Meta-Description und H1 pro Seite sauber setzen, LocalBusiness-Schema ergänzen und eine Sitemap bei der Google Search Console einreichen.",
      });
    }
  }

  if (maps) {
    const strong = maps.found && (maps.rating ?? 0) >= 4.5 && (maps.reviews ?? 0) >= 50;
    const medium = maps.found && (maps.reviews ?? 0) >= 10 && (maps.rating ?? 0) >= 4;
    add({
      id: "maps",
      category: "sichtbarkeit",
      label: "Google-Maps-Profil & Bewertungen",
      status: strong ? "good" : medium ? "warn" : "bad",
      value: maps.found ? `${maps.rating?.toLocaleString("de-LU") ?? "–"} ★ · ${maps.reviews ?? 0} Bewertungen` : "Kein Profil gefunden",
    });
    if (!strong) {
      find({
        id: "maps",
        category: "sichtbarkeit",
        severity: maps.found ? "medium" : "high",
        title: maps.found ? "Zu wenige Google-Bewertungen" : "Kein Google-Unternehmensprofil gefunden",
        detail: maps.found
          ? `Mit ${maps.reviews ?? 0} Bewertungen (${maps.rating?.toLocaleString("de-LU") ?? "–"} ★) wirkst du neben Wettbewerbern mit 50+ Bewertungen weniger vertrauenswürdig, gerade bei hohen Auftragswerten.`
          : "Ohne Google-Unternehmensprofil erscheinst du nicht in Google Maps und nicht in der Karten-Box über den Suchergebnissen.",
        recommendation: "Profil vollständig pflegen und nach jedem Auftrag automatisiert um eine Bewertung bitten (Ziel: 50+ Bewertungen mit 4,5 ★ oder mehr).",
      });
    }
  }

  // ---------- Website ----------
  add({
    id: "https",
    category: "website",
    label: "Sichere Verbindung (HTTPS)",
    status: site.https ? "good" : "bad",
    value: site.https ? "Aktiv" : "Fehlt",
  });
  if (!site.https) {
    find({
      id: "https",
      category: "website",
      severity: "high",
      title: "Deine Website gilt als „nicht sicher“",
      detail: "Browser zeigen bei deiner Seite eine Sicherheitswarnung an. Viele Besucher springen dann sofort ab.",
      recommendation: "SSL-Zertifikat aktivieren (meist kostenlos beim Hoster) und alle Seiten auf HTTPS umleiten.",
    });
  }

  add({
    id: "mobile",
    category: "website",
    label: "Für Smartphones optimiert",
    status: site.hasViewport ? "good" : "bad",
    value: site.hasViewport ? "Ja" : "Nein",
  });

  if (pagespeed) {
    const lcp = (pagespeed.lcpMs / 1000).toFixed(1).replace(".", ",");
    add({
      id: "speed",
      category: "website",
      label: "Ladezeit mobil (Google PageSpeed)",
      status: pagespeed.performance >= 80 ? "good" : pagespeed.performance >= 50 ? "warn" : "bad",
      value: `${pagespeed.performance}/100 · ${lcp} s`,
    });
    if (pagespeed.performance < 80) {
      find({
        id: "speed",
        category: "website",
        severity: pagespeed.performance < 50 ? "high" : "medium",
        title: `Langsame mobile Website (${lcp} Sekunden)`,
        detail: `Google bewertet deine mobile Ladegeschwindigkeit mit ${pagespeed.performance}/100. Ab 3 Sekunden Ladezeit springt über die Hälfte der mobilen Besucher ab, bevor sie dein Angebot überhaupt sehen.`,
        recommendation: "Bilder komprimieren (WebP), unnötige Plugins und Skripte entfernen, Caching aktivieren. Ziel: unter 2,5 s und mindestens 80/100.",
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

  // ---------- Conversion ----------
  add({
    id: "landing",
    category: "conversion",
    label: "Eigene Landingpages",
    status: site.landingPages >= 2 ? "good" : site.landingPages === 1 ? "warn" : "bad",
    value: site.landingPages ? `${site.landingPages} gefunden` : "Keine gefunden",
  });
  if (site.landingPages < 2) {
    find({
      id: "landing",
      category: "conversion",
      severity: site.landingPages ? "medium" : "high",
      title: site.landingPages ? "Nur eine Landingpage für deine Angebote" : "Keine Landingpages für deine Angebote",
      detail:
        "Besucher aus Werbung landen auf der allgemeinen Startseite statt auf einer Seite, die genau ein Angebot verkauft. Das kostet bei Kampagnen typischerweise 50 % und mehr der möglichen Anfragen.",
      recommendation:
        "Pro Hauptangebot eine fokussierte Landingpage: klares Versprechen, Referenzen und Vorher-Nachher-Bilder, Ablauf, FAQ und genau ein Call-to-Action (z. B. „Kostenloses Erstgespräch“).",
    });
  }

  add({
    id: "form",
    category: "conversion",
    label: "Anfrage-Formular / Online-Termin",
    status: site.hasForm || site.hasBooking ? "good" : "bad",
    value: site.hasBooking ? "Online-Terminbuchung" : site.hasForm ? "Formular vorhanden" : "Fehlt",
  });
  add({
    id: "cta",
    category: "conversion",
    label: "Klare Handlungsaufforderungen",
    status: site.ctaCount >= 3 ? "good" : site.ctaCount >= 1 ? "warn" : "bad",
    value: `${site.ctaCount} gefunden`,
  });
  add({
    id: "phone",
    category: "conversion",
    label: "Klickbare Telefonnummer",
    status: site.hasTelLink ? "good" : "warn",
    value: site.hasTelLink ? "Ja" : "Nein",
  });
  if (!(site.hasForm || site.hasBooking) || site.ctaCount < 3) {
    find({
      id: "conversion",
      category: "conversion",
      severity: site.hasForm || site.hasBooking ? "medium" : "high",
      title: site.hasForm || site.hasBooking ? "Zu wenige Handlungsaufforderungen" : "Besucher können dich kaum direkt anfragen",
      detail:
        site.hasForm || site.hasBooking
          ? `Nur ${site.ctaCount} klare Handlungsaufforderung(en) gefunden. Interessenten wissen nicht, was sie als Nächstes tun sollen.`
          : "Kein Anfrage-Formular und keine Online-Terminbuchung gefunden. Jeder Interessent muss aktiv anrufen oder eine Mail schreiben, und viele tun das nicht.",
      recommendation: "Ein kurzes Qualifizierungs-Formular (3–5 Felder) und ein sichtbarer Button „Kostenloses Erstgespräch“ in jedem Abschnitt, optional auch WhatsApp.",
    });
  }

  // ---------- Tracking ----------
  const t = site.tracking;
  add({
    id: "analytics",
    category: "tracking",
    label: "Google Analytics / Tag Manager",
    status: t.ga4 || t.gtm ? "good" : "bad",
    value: [t.ga4 && "GA4", t.gtm && "GTM"].filter(Boolean).join(" + ") || "Nicht gefunden",
  });
  add({
    id: "conversiontracking",
    category: "tracking",
    label: "Conversion-Tracking für Werbung",
    status: t.googleAdsTag || t.metaPixel ? "good" : t.gtm ? "warn" : "bad",
    value:
      [t.googleAdsTag && "Google Ads", t.metaPixel && "Meta Pixel", t.linkedin && "LinkedIn", t.tiktok && "TikTok"].filter(Boolean).join(", ") ||
      (t.gtm ? "Evtl. über GTM, nicht sichtbar" : "Nicht gefunden"),
  });
  if (!t.metaPixel && !t.googleAdsTag) {
    find({
      id: "tracking",
      category: "tracking",
      severity: "medium",
      title: "Kein Werbe-Tracking: Besucher gehen für immer verloren",
      detail:
        "Ohne Meta-Pixel und Google-Ads-Tag kannst du Website-Besucher nicht erneut ansprechen (Retargeting) und weißt nicht, welche Maßnahme Anfragen bringt. Bei langen Kaufentscheidungen für teure Angebote ist das besonders teuer.",
      recommendation: "Google Tag Manager mit GA4, Google-Ads-Conversion-Tag und Meta-Pixel (inkl. Conversions API) einrichten, DSGVO-konform mit Consent-Banner.",
    });
  }

  // ---------- Luxemburg ----------
  const langs = site.languages;
  const hasFr = langs.includes("fr");
  const hasDe = langs.includes("de");
  const hasEn = langs.includes("en");
  const langCount = [hasFr, hasDe, hasEn].filter(Boolean).length;
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
      severity: "high",
      title: "Deine Website spricht nicht die Sprachen deiner Kunden",
      detail: `In Luxemburg wird überwiegend auf Französisch gesucht, dazu auf Deutsch und Englisch (Expats und Grenzgänger). ${
        langs.length ? `Erkannt wurde nur: ${langs.map((l) => l.toUpperCase()).join(", ")}.` : "Es wurde nur eine Sprache erkannt."
      } Damit erreichst du einen großen Teil des Marktes gar nicht.`,
      recommendation: "Mindestens FR + DE, idealerweise auch EN, jeweils mit eigenen URLs (/fr, /de, /en) und hreflang-Tags, damit Google jede Sprachversion richtig ausspielt.",
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

  // ---------- Potenzial ----------
  const assumptions: string[] = [
    `Geschätzt ca. ${fmt(industry.monthlySearches)} Google-Suchen pro Monat in ganz Luxemburg für ${industry.label} (FR/DE/EN).`,
    `Ein optimal aufgestelltes Unternehmen erreicht ca. ${ACHIEVABLE_SHARE} % dieser Suchenden (Top-3-Ranking, Google Ads, starkes Maps-Profil).`,
    `Branchenübliche Anfragequote einer optimierten Website: ${(industry.conversionRate * 100).toFixed(1).replace(".", ",")} %, Abschlussquote: ${Math.round(industry.closeRate * 100)} %.`,
  ];

  let organic: number;
  if (ranking) {
    const p = ranking.organicPosition;
    organic = p && p <= 3 ? CHANNEL_SHARE.organicTop3 : p && p <= 10 ? CHANNEL_SHARE.organicTop10 : CHANNEL_SHARE.organicNone;
  } else {
    const seo = categories.find((c) => c.id === "sichtbarkeit")?.score ?? 30;
    organic = CHANNEL_SHARE.organicNone + (seo / 100) * (CHANNEL_SHARE.organicTop10 - CHANNEL_SHARE.organicNone);
    assumptions.push("Google-Ranking nicht live geprüft, daher aus den SEO-Grundlagen geschätzt.");
  }
  const paid = adsRunning ? CHANNEL_SHARE.ads : 0;
  let mapsShare: number;
  if (maps) {
    const r = maps.rating ?? 0;
    const n = maps.reviews ?? 0;
    mapsShare = !maps.found ? CHANNEL_SHARE.mapsNone : r >= 4.5 && n >= 50 ? CHANNEL_SHARE.mapsStrong : n >= 10 && r >= 4 ? CHANNEL_SHARE.mapsMedium : CHANNEL_SHARE.mapsWeak;
  } else {
    mapsShare = CHANNEL_SHARE.mapsMedium;
    assumptions.push("Google-Maps-Profil nicht live geprüft, daher wird ein mittelstarkes Profil angenommen.");
  }
  const currentShare = Math.min(organic + paid + mapsShare, ACHIEVABLE_SHARE);

  const websiteScore = categories.find((c) => c.id === "website")?.score ?? 50;
  const conversionScore = categories.find((c) => c.id === "conversion")?.score ?? 50;
  const quality = (websiteScore + conversionScore) / 200;
  const crNow = industry.conversionRate * (0.3 + 0.7 * quality);

  const dealValue = input.dealValue && input.dealValue > 0 ? input.dealValue : industry.dealValue;
  if (input.dealValue) assumptions.push(`Durchschnittlicher Auftragswert laut deiner Angabe: ${fmt(dealValue)} €.`);
  else assumptions.push(`Durchschnittlicher Auftragswert der Branche in Luxemburg: ca. ${fmt(dealValue)} €.`);

  const S = industry.monthlySearches;
  const currentLeads = S * (currentShare / 100) * crNow;
  const achievableLeads = S * (ACHIEVABLE_SHARE / 100) * industry.conversionRate;
  const lostLeads = Math.max(0, achievableLeads - currentLeads);
  const lostCustomers = lostLeads * industry.closeRate;
  const lostRevenueMonth = lostCustomers * dealValue;

  const potential: Potential = {
    monthlySearches: S,
    currentSharePct: round1(currentShare),
    achievableSharePct: ACHIEVABLE_SHARE,
    currentLeadsMonth: round1(currentLeads),
    achievableLeadsMonth: round1(achievableLeads),
    lostLeadsMonth: Math.round(lostLeads),
    lostCustomersMonth: round1(lostCustomers),
    lostRevenueMonth: roundMoney(lostRevenueMonth),
    lostRevenueYear: roundMoney(lostRevenueMonth) * 12,
    potentialPercent: Math.min(95, Math.max(5, Math.round((lostLeads / achievableLeads) * 100))),
    dealValue,
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
const roundMoney = (n: number) => (n >= 10000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100);
