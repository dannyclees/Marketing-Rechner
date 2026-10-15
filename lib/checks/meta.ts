import { nameMatches } from "./google";

export interface MetaAdsResult {
  running: boolean;
  ads: number;
}

/**
 * Schaltet die Firma aktuell Meta Ads (Facebook/Instagram) in Luxemburg?
 * Nutzt die offizielle Meta Ad Library API. Seit dem DSA sind dort alle Anzeigen
 * enthalten, die in der EU ausgespielt werden. Ohne META_ACCESS_TOKEN → null.
 */
export async function checkMetaAds(company: string): Promise<MetaAdsResult | null> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return null;
  const qs = new URLSearchParams({
    access_token: token,
    search_terms: company,
    ad_reached_countries: '["LU"]',
    ad_active_status: "ACTIVE",
    ad_type: "ALL",
    fields: "page_name",
    limit: "100",
  });
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${qs}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const data = await res.json();
    const own = (data.data ?? []).filter((ad: { page_name?: string }) => nameMatches(ad.page_name ?? "", company));
    return { running: own.length > 0, ads: own.length };
  } catch {
    return null;
  }
}
