import { Logo } from "@/components/Logo";
import { Rechner } from "@/components/Rechner";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "CE Marketing";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(11,107,176,0.35),transparent_65%)]" />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="whitespace-nowrap font-semibold tracking-tight">{BRAND}</span>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-white/60">
            🇱🇺 <span className="hidden sm:inline">Nur für Unternehmen in </span>Luxemburg
          </span>
        </header>

        <section className="pb-10 pt-8 text-center sm:pt-14">
          <p className="mx-auto inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-brand-light">
            Kostenloser Marketing-Potenzial-Rechner
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Wie viele Kunden verlierst du in Luxemburg an deine <span className="text-brand-light">Konkurrenz?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/65">
            Gib deine Website ein. Wir prüfen in 30 Sekunden deine Google Ads, deine Sichtbarkeit auf Google.lu, Landingpages, Ladezeit und Tracking und rechnen dir aus, wie viel Umsatz
            gerade liegen bleibt.
          </p>
        </section>

        <Rechner />

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            ["Google Ads & Ranking", "Schaltest du Anzeigen in Luxemburg? Wo stehst du auf Google.lu?"],
            ["Website & Landingpages", "Ladezeit, Anfrage-Wege, Landingpages, Sprachen FR/DE/EN."],
            ["Umsatz-Potenzial", "Wie viele Anfragen und wie viel Umsatz dir pro Monat entgehen."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-panel p-5">
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-sm text-white/55">{d}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 flex flex-wrap justify-between gap-3 border-t border-line pt-6 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {BRAND} · Alle Ergebnisse sind Schätzungen auf Basis öffentlicher Daten und Branchendurchschnitten.</span>
          <a href="/datenschutz" className="hover:text-white">
            Datenschutz
          </a>
        </footer>
      </div>
    </main>
  );
}
