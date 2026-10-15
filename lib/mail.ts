import type { FullReport } from "./types";

const num = (n: number) => n.toLocaleString("de-LU");

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  const { RESEND_API_KEY, MAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !MAIL_FROM) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error("[mail] Resend-Fehler", res.status, await res.text());
}

export async function sendReportMail(to: string, name: string, r: FullReport): Promise<void> {
  const booking = process.env.NEXT_PUBLIC_BOOKING_URL;
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "CE Marketing";
  const p = r.potential;
  const items = r.findings
    .map(
      (f) => `<tr><td style="padding:14px 0;border-bottom:1px solid #eee">
        <strong style="color:#111">${esc(f.title)}</strong><br>
        <span style="color:#555">${esc(f.detail)}</span><br>
        <span style="color:#0b6bb0"><strong>Empfehlung:</strong> ${esc(f.recommendation)}</span>
      </td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#111">
    <div style="background:#000;color:#fff;padding:28px;border-radius:12px">
      <p style="margin:0;color:#7fb8e6;font-size:13px;letter-spacing:1px;text-transform:uppercase">Marketing-Potenzial-Analyse</p>
      <h1 style="margin:8px 0 0;font-size:24px">${esc(r.company)} · ${esc(r.domain)}</h1>
      <p style="margin:18px 0 0;font-size:15px">Score: <strong>${r.score}/100</strong> · Ungenutztes Potenzial: <strong>${p.potentialPercent} %</strong></p>
    </div>
    <p style="margin-top:24px">Hallo ${esc(name)},</p>
    <p>hier ist deine vollständige Analyse. Nach unserer Schätzung erreichst du jeden Monat rund
    <strong>${num(p.missedPeopleMonth)} Kaufinteressenten in Luxemburg</strong> nicht. Dadurch entgehen dir etwa
    <strong style="color:#0b6bb0">${num(p.lostLeadsMonth)} Anfragen pro Monat</strong> (${num(p.lostLeadsYear)} pro Jahr).</p>
    <h2 style="font-size:18px;margin-top:28px">Deine Befunde & Empfehlungen</h2>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    ${
      booking
        ? `<p style="margin:32px 0;text-align:center"><a href="${esc(booking)}" style="background:#0b6bb0;color:#fff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:bold">Kostenloses Strategiegespräch buchen</a></p>`
        : ""
    }
    <p style="color:#888;font-size:12px">Alle Zahlen sind Schätzungen auf Basis von Branchendurchschnitten für Luxemburg und öffentlich sichtbaren Daten deiner Website.<br>${r.assumptions.map(esc).join("<br>")}</p>
    <p style="color:#888;font-size:12px">${esc(brand)}</p>
  </div>`;
  await send(to, `Deine Marketing-Analyse für ${r.company}: ${num(p.lostLeadsMonth)} verpasste Anfragen pro Monat`, html);
}

export async function notifyOwner(r: FullReport, contact: { email: string; name: string; phone: string }): Promise<void> {
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!to) return;
  const html = `<p><strong>Neuer Lead aus dem Marketing-Rechner</strong></p>
    <p>${esc(contact.name)} · ${esc(contact.email)} · ${esc(contact.phone || "keine Telefonnummer")}</p>
    <p>${esc(r.company)} (${esc(r.domain)}) · erkannte Branche: ${esc(r.industryLabel)}</p>
    <p>Score ${r.score}/100 · Potenzial ${r.potential.potentialPercent} % · ${num(r.potential.lostLeadsMonth)} verpasste Anfragen/Monat</p>
    <p>Top-Befunde:<br>${r.findings.slice(0, 5).map((f) => "• " + esc(f.title)).join("<br>")}</p>`;
  await send(to, `🔥 Neuer Lead: ${r.company} (${esc(r.industryLabel)}, Score ${r.score})`, html, contact.email);
}
