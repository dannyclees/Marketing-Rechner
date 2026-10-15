import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { FullReport } from "./types";

const TTL_MS = 1000 * 60 * 60 * 24 * 7;

let devSecret: string | undefined;

function key(): Buffer {
  let secret = process.env.REPORT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("REPORT_SECRET fehlt");
    devSecret ??= randomBytes(32).toString("hex");
    secret = devSecret;
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Der vollständige Report wird verschlüsselt an den Browser gegeben und erst
 * nach Eingabe der E-Mail vom Server entschlüsselt. So stehen die echten Zahlen
 * vorher nirgends im Quelltext und wir brauchen keine Datenbank für Scans.
 */
export function sealReport(report: FullReport): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = JSON.stringify({ exp: Date.now() + TTL_MS, report });
  const enc = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

export function openReport(token: string): FullReport {
  const buf = Buffer.from(token, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  const { exp, report } = JSON.parse(json) as { exp: number; report: FullReport };
  if (Date.now() > exp) throw new Error("Report abgelaufen");
  return report;
}
