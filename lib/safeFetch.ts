import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 3_000_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 MarketingRechner/1.0";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const l = ip.toLowerCase();
  const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return l === "::" || l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80");
}

/** Verhindert, dass der Scanner auf interne Adressen (SSRF) zugreift. */
export async function assertPublicUrl(u: URL): Promise<void> {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Nur http/https-Adressen sind erlaubt");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("Ungültiger Port");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Interne Adresse");
    return;
  }
  if (host === "localhost" || /\.(local|internal|localhost)$/.test(host)) throw new Error("Interne Adresse");
  let addrs;
  try {
    addrs = await lookup(host, { all: true });
  } catch (e) {
    // Nur für lokale Tests hinter einem Proxy ohne DNS (niemals in Produktion aktiv).
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_UNRESOLVED_HOSTS === "1") return;
    throw e;
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Interne Adresse");
}

export function normalizeUrl(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const u = new URL(s);
  u.hash = "";
  if (!u.hostname.includes(".")) throw new Error("Ungültige URL");
  return u;
}

export interface FetchResult {
  url: string;
  status: number;
  text: string;
  ms: number;
}

export async function safeFetch(url: string, timeoutMs = 12000, maxRedirects = 5): Promise<FetchResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let current = new URL(url);
    for (let i = 0; i <= maxRedirects; i++) {
      await assertPublicUrl(current);
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "accept-language": "fr-LU,fr;q=0.9,de;q=0.8,en;q=0.7" },
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        current = new URL(location, current);
        continue;
      }
      const text = await readLimited(res);
      return { url: current.toString(), status: res.status, text, ms: Date.now() - start };
    }
    throw new Error("Zu viele Weiterleitungen");
  } finally {
    clearTimeout(timer);
  }
}

async function readLimited(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
