# Marketing-Potenzial-Rechner Luxemburg

Lead Magnet für **CE Marketing**: Firmen aus Luxemburg geben Firmenname, Website und Branche ein.
Das Tool prüft automatisch ihr Online-Marketing und rechnet aus, wie viele Anfragen, Kunden und wie viel
Umsatz ihnen in ganz Luxemburg entgehen. Die Zahlen sind geblurrt und werden erst nach Eingabe der E-Mail freigeschaltet.

## Ablauf

1. **Eingabe:** Firmenname, Website, Branche (High-Ticket), optional Ø Auftragswert
2. **Analyse-Animation**, während im Hintergrund alle Checks laufen
3. **Teaser:** Score, Potenzial-Leiste, Prüfpunkte, 3 offene Befunde; Euro-Beträge und Empfehlungen sind gesperrt
4. **E-Mail-Gate:** Name, E-Mail, Telefon (optional), Einwilligung
5. **Voller Report** auf der Seite und per E-Mail, dazu CTA zum Strategiegespräch. Du bekommst eine Lead-Benachrichtigung.

## Was geprüft wird

| Check | Quelle |
|---|---|
| Google Ads aktiv in Luxemburg | SerpAPI → Google Ads Transparency Center (Region LU) |
| Ranking auf google.lu für das Branchen-Keyword, Mitbewerber mit Anzeigen | SerpAPI Google Search (gl=lu) |
| Google-Maps-Profil, Sterne, Anzahl Bewertungen | SerpAPI Google Maps |
| Ladezeit mobil | Google PageSpeed Insights |
| HTTPS, Mobile, SEO-Basics, Formulare, CTAs, Telefon, Online-Buchung | eigener Crawler |
| Landingpages | Crawler + sitemap.xml |
| Tracking: GA4, GTM, Google-Ads-Tag, Meta Pixel, LinkedIn, TikTok | Crawler |
| Sprachen FR / DE / EN, +352-Nummer | Crawler |

Ohne `SERPAPI_KEY` funktioniert alles weiterhin. Ads, Ranking und Maps werden dann aus Website-Signalen geschätzt.

## Potenzialrechnung

Siehe `lib/analyze.ts` und `lib/benchmarks.ts`:

- Suchvolumen pro Monat in **ganz Luxemburg** pro Branche
- × Marktanteil, den die Firma heute abgreift (Ranking + Ads + Maps) vs. erreichbares Maximum (15 %)
- × Anfragequote der Website (abhängig von Website- und Conversion-Score)
- × Abschlussquote × Ø Auftragswert = entgangener Umsatz

**Alle Benchmarks in `lib/benchmarks.ts` sind Schätzwerte.** Am besten mit Google Keyword Planner und echten Kundenzahlen nachschärfen.

## Sicherheit

- Die echten Zahlen kommen **erst nach der E-Mail-Eingabe** vom Server. Der vollständige Report wird AES-256-GCM-verschlüsselt
  an den Browser gegeben (`lib/token.ts`), daher ist auch keine Datenbank für Scans nötig.
- SSRF-Schutz: Der Crawler ruft keine internen IP-Adressen auf (`lib/safeFetch.ts`).
- Rate-Limit pro IP und Honeypot gegen Bots.

## Setup

```bash
npm install
cp .env.example .env.local   # Keys eintragen
npm run dev                  # http://localhost:3000
```

Deployment: Repo bei **Vercel** importieren und die Umgebungsvariablen aus `.env.example` setzen
(mindestens `REPORT_SECRET`). Für Leads: Supabase-Tabelle mit `supabase/schema.sql` anlegen
und/oder `LEAD_WEBHOOK_URL` (Zapier/Make → CRM) setzen. Ohne Speicher landen Leads lokal in `data/leads.jsonl`.

## Offen / nächste Schritte

- [ ] Echte Datenschutzerklärung (`app/datenschutz/page.tsx`) und Impressum
- [ ] Original-Logo als Datei einbinden (aktuell SVG-Nachbau in `components/Logo.tsx` und `public/logo.svg`)
- [ ] Benchmarks mit echten Daten nachschärfen
- [ ] V2: PDF-Report, KI-Texte (Claude) pro Befund, Meta Ad Library, FR-Version der Seite
