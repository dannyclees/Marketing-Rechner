/**
 * Google-Checks über SerpAPI (https://serpapi.com), alle auf Luxemburg begrenzt.
 * Ohne SERPAPI_KEY liefern alle Funktionen `null` → der Check gilt als "nicht geprüft".
 */

const LU_REGION = "2442"; // Google-Regionscode Luxemburg (Ads Transparency Center)

async function serp(params: Record<string, string>): Promise<any | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const qs = new URLSearchParams({ ...params, api_key: key });
  try {
    const res = await fetch(`https://serpapi.com/search.json?${qs}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function baseDomain(host: string): string {
  return host.replace(/^www\./, "").toLowerCase();
}

function sameSite(link: string | undefined, domain: string): boolean {
  if (!link) return false;
  try {
    const h = baseDomain(new URL(link.startsWith("http") ? link : `https://${link}`).hostname);
    return h === domain || h.endsWith("." + domain);
  } catch {
    return false;
  }
}

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(s\.?a\.?r\.?l\.?|s\.?a\.?|s\.?a r\.?l\.?|gmbh|sarl-s|sarls|sca|ltd|luxembourg)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameMatches(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}

export interface AdsResult {
  running: boolean;
  creatives: number;
}

/** Schaltet die Domain aktuell Google Ads in Luxemburg? (Google Ads Transparency Center) */
export async function checkGoogleAds(domain: string): Promise<AdsResult | null> {
  const data = await serp({ engine: "google_ads_transparency_center", text: domain, region: LU_REGION });
  if (!data) return null;
  const creatives: any[] = data.ad_creatives ?? [];
  const own = creatives.filter((c) => !c.target_domain || sameSite(c.target_domain, domain));
  return { running: own.length > 0, creatives: own.length };
}

export interface SerpResult {
  organicPosition: number | null;
  paidVisible: boolean;
  inLocalPack: boolean;
  competitorsWithAds: number;
}

/** Wo steht die Firma bei Google.lu für das Branchen-Keyword? */
export async function checkRanking(keyword: string, domain: string, company: string): Promise<SerpResult | null> {
  if (!keyword) return null;
  const data = await serp({
    engine: "google",
    q: keyword,
    google_domain: "google.lu",
    gl: "lu",
    hl: "fr",
    location: "Luxembourg",
    num: "20",
  });
  if (!data) return null;
  const organic: any[] = data.organic_results ?? [];
  const hit = organic.find((r) => sameSite(r.link, domain));
  const ads: any[] = [...(data.ads ?? []), ...(data.top_ads ?? [])];
  const places: any[] = data.local_results?.places ?? [];
  return {
    organicPosition: hit ? hit.position ?? organic.indexOf(hit) + 1 : null,
    paidVisible: ads.some((a) => sameSite(a.link ?? a.displayed_link, domain)),
    inLocalPack: places.some((p) => nameMatches(p.title ?? "", company) || sameSite(p.links?.website, domain)),
    competitorsWithAds: ads.filter((a) => !sameSite(a.link ?? a.displayed_link, domain)).length,
  };
}

export interface MapsResult {
  found: boolean;
  rating: number | null;
  reviews: number | null;
}

/** Google-Maps-Profil & Bewertungen. */
export async function checkMaps(company: string, domain: string): Promise<MapsResult | null> {
  const data = await serp({
    engine: "google_maps",
    q: `${company} Luxembourg`,
    type: "search",
    hl: "fr",
    ll: "@49.8153,6.1296,10z",
  });
  if (!data) return null;
  const candidates: any[] = data.place_results ? [data.place_results] : data.local_results ?? [];
  const place =
    candidates.find((p) => sameSite(p.website, domain)) ?? candidates.find((p) => nameMatches(p.title ?? "", company));
  if (!place) return { found: false, rating: null, reviews: null };
  return { found: true, rating: place.rating ?? null, reviews: place.reviews ?? null };
}
