export interface PageSpeed {
  performance: number;
  seo: number;
  lcpMs: number;
}

export async function runPageSpeed(url: string): Promise<PageSpeed | null> {
  const params = new URLSearchParams({ url, strategy: "mobile" });
  params.append("category", "performance");
  params.append("category", "seo");
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lh = data.lighthouseResult;
    return {
      performance: Math.round((lh.categories.performance?.score ?? 0) * 100),
      seo: Math.round((lh.categories.seo?.score ?? 0) * 100),
      lcpMs: Math.round(lh.audits?.["largest-contentful-paint"]?.numericValue ?? 0),
    };
  } catch {
    return null;
  }
}
