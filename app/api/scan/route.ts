import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { detectIndustry } from "@/lib/benchmarks";
import { crawlSite } from "@/lib/checks/crawl";
import { baseDomain, checkGoogleAds, checkMaps, checkRanking } from "@/lib/checks/google";
import { checkMetaAds } from "@/lib/checks/meta";
import { runPageSpeed } from "@/lib/checks/pagespeed";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { normalizeUrl } from "@/lib/safeFetch";
import { sealReport } from "@/lib/token";
import type { Teaser } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!rateLimit(`scan:${clientIp(req)}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Zu viele Analysen. Bitte versuche es später erneut." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const company = String(body?.company ?? "").trim().slice(0, 120);
  const rawUrl = String(body?.url ?? "").trim().slice(0, 300);
  if (!company || !rawUrl) return NextResponse.json({ error: "Bitte Firmenname und Website angeben." }, { status: 400 });

  let url: URL;
  try {
    url = normalizeUrl(rawUrl);
  } catch {
    return NextResponse.json({ error: "Diese Website-Adresse ist ungültig." }, { status: 400 });
  }
  const domain = baseDomain(url.hostname);

  let site;
  try {
    site = await crawlSite(url);
  } catch (e) {
    return NextResponse.json(
      { error: `Wir konnten ${domain} nicht laden. Ist die Adresse richtig? (${e instanceof Error ? e.message : "Fehler"})` },
      { status: 422 },
    );
  }

  const industry = detectIndustry(site.headlineText, site.bodyText);

  const [pagespeed, googleAds, metaAds, ranking, maps] = await Promise.all([
    runPageSpeed(site.finalUrl),
    checkGoogleAds(domain),
    checkMetaAds(company),
    checkRanking(industry.keyword, domain, company),
    checkMaps(company, domain),
  ]);

  const report = analyze({ company, domain, industry, site, pagespeed, googleAds, metaAds, ranking, maps });

  const preview = report.findings.slice(0, 3).map(({ recommendation: _r, ...f }) => f);
  const teaser: Teaser = {
    company: report.company,
    domain: report.domain,
    industryLabel: report.industryLabel,
    keyword: report.keyword,
    score: report.score,
    potentialPercent: report.potential.potentialPercent,
    monthlySearches: report.potential.monthlySearches,
    categories: report.categories,
    checks: report.checks,
    previewFindings: preview,
    lockedFindingsCount: Math.max(0, report.findings.length - preview.length),
    token: sealReport(report),
  };
  return NextResponse.json(teaser);
}
