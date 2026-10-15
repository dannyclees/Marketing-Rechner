import * as cheerio from "cheerio";
import { safeFetch } from "../safeFetch";

export interface SiteSignals {
  reachable: boolean;
  finalUrl: string;
  https: boolean;
  loadMs: number;
  title: string;
  metaDescription: string;
  h1Count: number;
  hasViewport: boolean;
  languages: string[];
  hasTelLink: boolean;
  hasLuxPhone: boolean;
  hasForm: boolean;
  hasEmailLink: boolean;
  ctaCount: number;
  hasBooking: boolean;
  hasWhatsApp: boolean;
  hasStructuredData: boolean;
  tracking: { ga4: boolean; gtm: boolean; googleAdsTag: boolean; metaPixel: boolean; linkedin: boolean; tiktok: boolean };
  sitemapUrls: number | null;
  landingPages: number;
}

const CTA_RE = /(kontakt|contact|termin|rendez-vous|rdv|devis|angebot|offerte|anfrage|demande|réserv|reserv|book|buchen|appel|anrufen|call|beratung|consultation|estimation|bewertung|gratuit|kostenlos)/i;
const BOOKING_RE = /(calendly|doctena|doctolib|resengo|treatwell|planity|zenchef|thefork|booksy|simplybook|acuity|hubspot\.com\/meetings|cal\.com)/i;
const LANDING_RE = /(landing|\/lp[\/-]|\/lp$|angebot|aktion|offre|promo|kampagne|campagne|campaign|special|gratis|gratuit|kostenlos|estimation|bewertung)/i;

export async function crawlSite(url: URL): Promise<SiteSignals> {
  let res;
  try {
    res = await safeFetch(url.toString());
  } catch {
    if (url.protocol === "https:") {
      const http = new URL(url);
      http.protocol = "http:";
      res = await safeFetch(http.toString());
    } else throw new Error("Website nicht erreichbar");
  }
  if (res.status >= 400) throw new Error(`Website antwortet mit Fehler ${res.status}`);

  const html = res.text;
  const $ = cheerio.load(html);
  const final = new URL(res.url);

  const languages = new Set<string>();
  const htmlLang = ($("html").attr("lang") || "").slice(0, 2).toLowerCase();
  if (htmlLang) languages.add(htmlLang);
  $("link[hreflang]").each((_, el) => {
    const l = ($(el).attr("hreflang") || "").slice(0, 2).toLowerCase();
    if (/^[a-z]{2}$/.test(l)) languages.add(l);
  });

  let ctaCount = 0;
  let hasTelLink = false;
  let hasEmailLink = false;
  let hasBooking = false;
  let hasWhatsApp = false;
  const internalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (href.startsWith("tel:")) hasTelLink = true;
    if (href.startsWith("mailto:")) hasEmailLink = true;
    if (BOOKING_RE.test(href)) hasBooking = true;
    if (/wa\.me|whatsapp/i.test(href)) hasWhatsApp = true;
    if (CTA_RE.test(text) && text.length < 60) ctaCount++;
    const lang = href.match(/^(?:https?:\/\/[^/]+)?\/(fr|de|en|lb|lu|pt)(?:\/|$)/i);
    if (lang) languages.add(lang[1].toLowerCase() === "lu" ? "lb" : lang[1].toLowerCase());
    try {
      const abs = new URL(href, final);
      if (abs.hostname === final.hostname) internalLinks.add(abs.pathname);
    } catch {}
  });
  $("button, input[type=submit]").each((_, el) => {
    const t = ($(el).text() || $(el).attr("value") || "").trim();
    if (CTA_RE.test(t) && t.length < 60) ctaCount++;
  });

  const hasForm =
    $("form").filter((_, f) => {
      const form = $(f);
      if (form.attr("role") === "search") return false;
      const inputs = form.find("input:not([type=hidden]):not([type=search]):not([type=submit]), textarea, select");
      return inputs.length >= 2;
    }).length > 0 || BOOKING_RE.test(html) || /hsforms|typeform|jotform|wpforms|gravityforms|contact-form-7|wpcf7/i.test(html);

  const bodyText = $("body").text();

  const tracking = {
    ga4: /G-[A-Z0-9]{6,}/.test(html) && /gtag|googletagmanager/.test(html),
    gtm: /GTM-[A-Z0-9]{4,}/.test(html),
    googleAdsTag: /AW-\d{6,}/.test(html),
    metaPixel: /fbq\(|connect\.facebook\.net\/[^"']*fbevents/.test(html),
    linkedin: /snap\.licdn\.com|_linkedin_partner_id/.test(html),
    tiktok: /analytics\.tiktok\.com/.test(html),
  };

  const { count: sitemapUrls, urls } = await readSitemap(final);
  const landing = new Set<string>();
  for (const p of [...internalLinks, ...urls]) {
    try {
      const path = p.startsWith("http") ? new URL(p).pathname : p;
      if (LANDING_RE.test(path)) landing.add(path);
    } catch {}
  }

  return {
    reachable: true,
    finalUrl: final.toString(),
    https: final.protocol === "https:",
    loadMs: res.ms,
    title: $("title").first().text().trim(),
    metaDescription: ($('meta[name="description"]').attr("content") || "").trim(),
    h1Count: $("h1").length,
    hasViewport: $('meta[name="viewport"]').length > 0,
    languages: [...languages],
    hasTelLink,
    hasLuxPhone: /(\+|00)\s?352[\s\d./-]{6,}/.test(bodyText) || /tel:(\+|00)352/.test(html),
    hasForm,
    hasEmailLink,
    ctaCount,
    hasBooking,
    hasWhatsApp,
    hasStructuredData: $('script[type="application/ld+json"]').length > 0,
    tracking,
    sitemapUrls,
    landingPages: landing.size,
  };
}

async function readSitemap(base: URL): Promise<{ count: number | null; urls: string[] }> {
  try {
    const res = await safeFetch(new URL("/sitemap.xml", base).toString(), 8000);
    if (res.status >= 400 || !/<(urlset|sitemapindex)/.test(res.text)) {
      return { count: null, urls: [] };
    }
    const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (!/<sitemapindex/.test(res.text)) {
      const urls = locs(res.text);
      return { count: urls.length, urls };
    }
    const children = locs(res.text).slice(0, 4);
    const nested = await Promise.all(
      children.map((c) => safeFetch(c, 8000).then((r) => locs(r.text)).catch(() => [] as string[])),
    );
    const urls = nested.flat();
    return { count: urls.length, urls };
  } catch {
    return { count: null, urls: [] };
  }
}
