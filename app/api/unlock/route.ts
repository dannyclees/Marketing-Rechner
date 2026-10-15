import { NextResponse } from "next/server";
import { saveLead, toLead } from "@/lib/leads";
import { notifyOwner, sendReportMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { openReport } from "@/lib/token";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!rateLimit(`unlock:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 }); // Honeypot

  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const phone = String(body?.phone ?? "").trim().slice(0, 40);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse an." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Bitte gib deinen Namen an." }, { status: 400 });
  if (body?.consent !== true) return NextResponse.json({ error: "Bitte stimme der Datenschutzerklärung zu." }, { status: 400 });

  let report;
  try {
    report = openReport(String(body?.token ?? ""));
  } catch {
    return NextResponse.json({ error: "Die Analyse ist abgelaufen. Bitte starte sie neu." }, { status: 400 });
  }

  const contact = { email, name, phone };
  await Promise.allSettled([saveLead(toLead(report, contact)), sendReportMail(email, name, report), notifyOwner(report, contact)]);

  return NextResponse.json(report);
}
