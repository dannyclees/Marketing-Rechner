/**
 * Branchen-Benchmarks für Luxemburg (Fokus: hochpreisige Angebote).
 *
 * ALLE WERTE SIND SCHÄTZUNGEN und sollten mit echten Daten (Google Keyword
 * Planner, eigene Kundenzahlen) nachgeschärft werden.
 *
 * - monthlySearches: geschätzte Google-Suchen pro Monat in ganz Luxemburg
 *   (FR/DE/EN/LB, alle relevanten Keywords der Branche zusammen)
 * - conversionRate:  Website-Besucher → Anfrage, bei gut optimierter Seite
 * - closeRate:       Anfrage → zahlender Kunde
 * - dealValue:       durchschnittlicher Auftragswert in € (Erstauftrag/1. Jahr)
 * - keyword:         Haupt-Keyword für den Ranking-Check auf google.lu
 */
export interface Industry {
  id: string;
  label: string;
  keyword: string;
  monthlySearches: number;
  conversionRate: number;
  closeRate: number;
  dealValue: number;
}

export const INDUSTRIES: Industry[] = [
  { id: "immobilien", label: "Immobilienagentur", keyword: "agence immobilière luxembourg", monthlySearches: 18000, conversionRate: 0.03, closeRate: 0.08, dealValue: 18000 },
  { id: "bautraeger", label: "Bauträger / Promoteur", keyword: "promoteur immobilier luxembourg", monthlySearches: 6000, conversionRate: 0.025, closeRate: 0.05, dealValue: 45000 },
  { id: "bau", label: "Bau & Renovierung", keyword: "entreprise rénovation luxembourg", monthlySearches: 5000, conversionRate: 0.04, closeRate: 0.15, dealValue: 35000 },
  { id: "architekt", label: "Architekt / Innenarchitekt", keyword: "architecte luxembourg", monthlySearches: 3000, conversionRate: 0.04, closeRate: 0.2, dealValue: 25000 },
  { id: "energie", label: "Photovoltaik / Wärmepumpe", keyword: "panneaux solaires luxembourg", monthlySearches: 4500, conversionRate: 0.05, closeRate: 0.2, dealValue: 22000 },
  { id: "sanitaer", label: "Sanitär, Heizung & Bad", keyword: "salle de bain luxembourg", monthlySearches: 5000, conversionRate: 0.05, closeRate: 0.25, dealValue: 14000 },
  { id: "kuechen", label: "Küchen & Möbel", keyword: "cuisine équipée luxembourg", monthlySearches: 4000, conversionRate: 0.04, closeRate: 0.25, dealValue: 20000 },
  { id: "fenster", label: "Fenster, Türen & Fassade", keyword: "fenêtres luxembourg", monthlySearches: 3000, conversionRate: 0.05, closeRate: 0.25, dealValue: 15000 },
  { id: "dach", label: "Dachdecker", keyword: "couvreur luxembourg", monthlySearches: 2500, conversionRate: 0.06, closeRate: 0.3, dealValue: 12000 },
  { id: "pool", label: "Pool, Garten & Landschaftsbau", keyword: "paysagiste luxembourg", monthlySearches: 3500, conversionRate: 0.04, closeRate: 0.2, dealValue: 18000 },
  { id: "zahn", label: "Zahnarzt (Implantate, Ästhetik)", keyword: "implant dentaire luxembourg", monthlySearches: 4000, conversionRate: 0.05, closeRate: 0.35, dealValue: 4500 },
  { id: "aesthetik", label: "Ästhetische Medizin / Klinik", keyword: "médecine esthétique luxembourg", monthlySearches: 3500, conversionRate: 0.05, closeRate: 0.35, dealValue: 3500 },
  { id: "anwalt", label: "Rechtsanwalt / Avocat", keyword: "avocat luxembourg", monthlySearches: 9000, conversionRate: 0.04, closeRate: 0.3, dealValue: 5000 },
  { id: "fiduciaire", label: "Fiduciaire / Steuerberatung", keyword: "fiduciaire luxembourg", monthlySearches: 6000, conversionRate: 0.04, closeRate: 0.3, dealValue: 6000 },
  { id: "finanz", label: "Finanz- & Vermögensberatung", keyword: "conseiller financier luxembourg", monthlySearches: 2500, conversionRate: 0.03, closeRate: 0.2, dealValue: 8000 },
  { id: "auto", label: "Autohaus (Premium)", keyword: "voiture occasion luxembourg", monthlySearches: 20000, conversionRate: 0.02, closeRate: 0.12, dealValue: 45000 },
  { id: "events", label: "Hochzeit & Events", keyword: "salle de mariage luxembourg", monthlySearches: 2500, conversionRate: 0.04, closeRate: 0.25, dealValue: 15000 },
  { id: "b2b", label: "B2B-Dienstleistung / IT", keyword: "", monthlySearches: 3000, conversionRate: 0.03, closeRate: 0.2, dealValue: 15000 },
  { id: "sonstiges", label: "Andere Branche", keyword: "", monthlySearches: 3000, conversionRate: 0.04, closeRate: 0.25, dealValue: 8000 },
];

export function getIndustry(id: string): Industry {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[INDUSTRIES.length - 1];
}

/**
 * Marktanteil der Suchen, die ein Unternehmen pro Kanal realistisch abgreifen
 * kann (in % aller Branchen-Suchen in Luxemburg). Summe = erreichbares Maximum.
 */
export const CHANNEL_SHARE = {
  organicTop3: 6,
  organicTop10: 1.5,
  organicNone: 0.3,
  ads: 5,
  mapsStrong: 4,
  mapsMedium: 2,
  mapsWeak: 1,
  mapsNone: 0.2,
} as const;

export const ACHIEVABLE_SHARE = CHANNEL_SHARE.organicTop3 + CHANNEL_SHARE.ads + CHANNEL_SHARE.mapsStrong;
