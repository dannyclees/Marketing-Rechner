import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { FullReport } from "./types";

export interface Lead {
  email: string;
  name: string;
  phone: string;
  company: string;
  domain: string;
  industry: string;
  score: number;
  lostRevenueMonth: number;
  potentialPercent: number;
  createdAt: string;
}

export function toLead(report: FullReport, contact: { email: string; name: string; phone: string }): Lead {
  return {
    ...contact,
    company: report.company,
    domain: report.domain,
    industry: report.industryLabel,
    score: report.score,
    lostRevenueMonth: report.potential.lostRevenueMonth,
    potentialPercent: report.potential.potentialPercent,
    createdAt: new Date().toISOString(),
  };
}

/** Speichert den Lead in Supabase und/oder schickt ihn an einen Webhook (Zapier, Make, CRM). */
export async function saveLead(lead: Lead): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LEAD_WEBHOOK_URL } = process.env;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    tasks.push(
      fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "content-type": "application/json",
          prefer: "return=minimal",
        },
        body: JSON.stringify({
          email: lead.email,
          name: lead.name,
          phone: lead.phone,
          company: lead.company,
          domain: lead.domain,
          industry: lead.industry,
          score: lead.score,
          lost_revenue_month: lead.lostRevenueMonth,
          potential_percent: lead.potentialPercent,
          created_at: lead.createdAt,
        }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
      }),
    );
  }
  if (LEAD_WEBHOOK_URL) {
    tasks.push(fetch(LEAD_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lead) }));
  }
  if (!tasks.length) {
    if (process.env.NODE_ENV !== "production") {
      const dir = path.join(process.cwd(), "data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(lead) + "\n");
    } else {
      console.warn("[lead] Kein Speicher konfiguriert:", JSON.stringify(lead));
    }
    return;
  }
  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === "rejected") console.error("[lead] Speichern fehlgeschlagen:", r.reason);
}
