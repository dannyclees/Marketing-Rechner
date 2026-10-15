export type Status = "good" | "warn" | "bad" | "unknown";

export type CategoryId = "sichtbarkeit" | "website" | "conversion" | "tracking" | "luxemburg";

export interface Check {
  id: string;
  category: CategoryId;
  label: string;
  status: Status;
  value: string;
}

export interface Finding {
  id: string;
  category: CategoryId;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  recommendation: string;
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  score: number | null;
}

export interface Potential {
  monthlySearches: number;
  currentSharePct: number;
  achievableSharePct: number;
  currentLeadsMonth: number;
  achievableLeadsMonth: number;
  lostLeadsMonth: number;
  lostCustomersMonth: number;
  lostRevenueMonth: number;
  lostRevenueYear: number;
  potentialPercent: number;
  dealValue: number;
}

export interface FullReport {
  company: string;
  domain: string;
  url: string;
  industryId: string;
  industryLabel: string;
  keyword: string;
  scannedAt: string;
  score: number;
  categories: CategoryScore[];
  checks: Check[];
  findings: Finding[];
  potential: Potential;
  assumptions: string[];
}

/** Was der Browser vor der E-Mail-Eingabe zu sehen bekommt – keine Euro-Beträge, keine Empfehlungen. */
export interface Teaser {
  company: string;
  domain: string;
  industryLabel: string;
  keyword: string;
  score: number;
  potentialPercent: number;
  monthlySearches: number;
  categories: CategoryScore[];
  checks: Check[];
  previewFindings: Omit<Finding, "recommendation">[];
  lockedFindingsCount: number;
  token: string;
}
