/**
 * Branchen-Benchmarks für Luxemburg (Fokus: hochpreisige Angebote).
 *
 * ALLE WERTE SIND SCHÄTZUNGEN und sollten mit echten Daten (Google Keyword
 * Planner, eigene Kundenzahlen) nachgeschärft werden.
 *
 * - monthlySearches: geschätzte Google-Suchen pro Monat in ganz Luxemburg
 *   (FR/DE/EN/LB, alle relevanten Keywords der Branche zusammen)
 * - conversionRate:  Website-Besucher → Anfrage, bei gut optimierter Seite
 * - keyword:         Haupt-Keyword für den Ranking-Check auf google.lu
 * - signals:         Begriffe (FR/DE/EN), an denen die Branche auf der Website erkannt wird
 */
export interface Industry {
  id: string;
  label: string;
  keyword: string;
  monthlySearches: number;
  conversionRate: number;
  signals: string[];
}

export const INDUSTRIES: Industry[] = [
  { id: "immobilien", label: "Immobilienagentur", keyword: "agence immobilière luxembourg", monthlySearches: 18000, conversionRate: 0.03, signals: ["agence immobilière","immobilier","immobilien","real estate","à vendre","à louer","appartement","maison à vendre","estimation"] },
  { id: "bautraeger", label: "Bauträger / Promoteur", keyword: "promoteur immobilier luxembourg", monthlySearches: 6000, conversionRate: 0.025, signals: ["promoteur","promotion immobilière","bauträger","nouvelle construction","vefa","résidence","neubau","projets immobiliers"] },
  { id: "bau", label: "Bau & Renovierung", keyword: "entreprise rénovation luxembourg", monthlySearches: 5000, conversionRate: 0.04, signals: ["rénovation","construction","bauunternehmen","renovierung","gros œuvre","rohbau","transformation","entreprise générale"] },
  { id: "architekt", label: "Architekt / Innenarchitekt", keyword: "architecte luxembourg", monthlySearches: 3000, conversionRate: 0.04, signals: ["architecte","architekt","architecture","architektur","bureau d'architecture","architecte d'intérieur","interior design"] },
  { id: "energie", label: "Photovoltaik / Wärmepumpe", keyword: "panneaux solaires luxembourg", monthlySearches: 4500, conversionRate: 0.05, signals: ["photovoltaïque","panneaux solaires","photovoltaik","solaire","pompe à chaleur","wärmepumpe","solar","heat pump"] },
  { id: "sanitaer", label: "Sanitär, Heizung & Bad", keyword: "salle de bain luxembourg", monthlySearches: 5000, conversionRate: 0.05, signals: ["chauffage","sanitaire","salle de bain","heizung","sanitär","badezimmer","chauffagiste","installateur"] },
  { id: "kuechen", label: "Küchen & Möbel", keyword: "cuisine équipée luxembourg", monthlySearches: 4000, conversionRate: 0.04, signals: ["cuisine","cuisines","küche","küchen","kitchen","meubles","möbel","mobilier","dressing"] },
  { id: "fenster", label: "Fenster, Türen & Fassade", keyword: "fenêtres luxembourg", monthlySearches: 3000, conversionRate: 0.05, signals: ["fenêtres","fenster","portes","türen","menuiserie","volets","châssis","façade","fassade"] },
  { id: "dach", label: "Dachdecker", keyword: "couvreur luxembourg", monthlySearches: 2500, conversionRate: 0.06, signals: ["toiture","couvreur","dachdecker","dach","toit","zinguerie","charpente"] },
  { id: "pool", label: "Pool, Garten & Landschaftsbau", keyword: "paysagiste luxembourg", monthlySearches: 3500, conversionRate: 0.04, signals: ["piscine","pool","jardin","paysagiste","garten","landschaftsbau","aménagement extérieur","terrasse"] },
  { id: "zahn", label: "Zahnarzt (Implantate, Ästhetik)", keyword: "implant dentaire luxembourg", monthlySearches: 4000, conversionRate: 0.05, signals: ["dentiste","dentaire","implant","zahnarzt","zahn","orthodont","cabinet dentaire","dental"] },
  { id: "aesthetik", label: "Ästhetische Medizin / Klinik", keyword: "médecine esthétique luxembourg", monthlySearches: 3500, conversionRate: 0.05, signals: ["médecine esthétique","esthétique","botox","acide hyaluronique","ästhetik","chirurgie esthétique","lipo","aesthetic"] },
  { id: "anwalt", label: "Rechtsanwalt / Avocat", keyword: "avocat luxembourg", monthlySearches: 9000, conversionRate: 0.04, signals: ["avocat","avocats","rechtsanwalt","law firm","cabinet d'avocats","droit","kanzlei","lawyer"] },
  { id: "fiduciaire", label: "Fiduciaire / Steuerberatung", keyword: "fiduciaire luxembourg", monthlySearches: 6000, conversionRate: 0.04, signals: ["fiduciaire","comptabilité","expert-comptable","steuerberatung","buchhaltung","accounting","domiciliation","tva"] },
  { id: "finanz", label: "Finanz- & Vermögensberatung", keyword: "conseiller financier luxembourg", monthlySearches: 2500, conversionRate: 0.03, signals: ["conseil financier","gestion de patrimoine","vermögensberatung","wealth","investissement","assurance","finanzberatung","patrimoine"] },
  { id: "auto", label: "Autohaus (Premium)", keyword: "voiture occasion luxembourg", monthlySearches: 20000, conversionRate: 0.02, signals: ["voiture","voitures","occasion","concession","autohaus","fahrzeug","véhicule","leasing","garage"] },
  { id: "events", label: "Hochzeit & Events", keyword: "salle de mariage luxembourg", monthlySearches: 2500, conversionRate: 0.04, signals: ["mariage","hochzeit","wedding","événement","event","traiteur","catering","réception"] },
  { id: "b2b", label: "B2B-Dienstleistung / IT", keyword: "", monthlySearches: 3000, conversionRate: 0.03, signals: ["logiciel","software","saas","solutions it","consulting","b2b","digital","informatique","cybersecurity"] },
  { id: "sonstiges", label: "Dienstleistung", keyword: "", monthlySearches: 3000, conversionRate: 0.04, signals: [] },
];

export function getIndustry(id: string): Industry {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1];
}

/**
 * Marktanteil der Suchen, die ein Unternehmen pro Kanal realistisch abgreifen
 * kann (in % aller Branchen-Suchen in Luxemburg). Summe = erreichbares Maximum.
 */
export const CHANNEL_SHARE = {
  // Meta Ads (Facebook/Instagram) erreichen Kaufinteressenten, bevor sie suchen.
  // Wert = zusätzliche Reichweite relativ zum Suchvolumen.
  meta: 4,
  organicTop3: 6,
  organicTop10: 1.5,
  organicNone: 0.3,
  ads: 5,
  mapsStrong: 4,
  mapsMedium: 2,
  mapsWeak: 1,
  mapsNone: 0.2,
} as const;

export const ACHIEVABLE_SHARE = CHANNEL_SHARE.organicTop3 + CHANNEL_SHARE.ads + CHANNEL_SHARE.meta + CHANNEL_SHARE.mapsStrong;

/** Erkennt die Branche aus dem Text der Website. Titel und Überschriften zählen dreifach. */
export function detectIndustry(headline: string, body: string): Industry {
  const h = headline.toLowerCase();
  const b = body.toLowerCase();
  let best = INDUSTRIES[INDUSTRIES.length - 1];
  let bestScore = 0;
  for (const ind of INDUSTRIES) {
    let score = 0;
    for (const sig of ind.signals) {
      score += countOf(h, sig) * 3 + Math.min(countOf(b, sig), 5);
    }
    if (score > bestScore) {
      best = ind;
      bestScore = score;
    }
  }
  return bestScore >= 3 ? best : INDUSTRIES[INDUSTRIES.length - 1];
}

function countOf(text: string, term: string): number {
  let n = 0;
  for (let i = text.indexOf(term); i !== -1; i = text.indexOf(term, i + term.length)) n++;
  return n;
}
