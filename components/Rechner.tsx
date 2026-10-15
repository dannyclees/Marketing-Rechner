"use client";

import { useEffect, useRef, useState } from "react";
import type { Check, Finding, FullReport, Status, Teaser } from "@/lib/types";

type Phase = "form" | "scanning" | "result";

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL;
const MIN_SCAN_MS = 9000;

const num = (n: number) => n.toLocaleString("de-LU");

export function Rechner() {
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState({ company: "", url: "" });
  const [error, setError] = useState("");
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  async function startScan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhase("scanning");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    const started = Date.now();
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse fehlgeschlagen");
      await new Promise((r) => setTimeout(r, Math.max(0, MIN_SCAN_MS - (Date.now() - started))));
      setTeaser(data);
      setReport(null);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
      setPhase("form");
    }
  }

  return (
    <div ref={topRef} className="scroll-mt-6">
      {phase === "form" && <ScanForm form={form} setForm={setForm} onSubmit={startScan} error={error} />}
      {phase === "scanning" && <Scanning company={form.company} />}
      {phase === "result" && teaser && (
        <Result
          teaser={teaser}
          report={report}
          onUnlock={setReport}
          onRestart={() => {
            setTeaser(null);
            setReport(null);
            setPhase("form");
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Formular */

function ScanForm({
  form,
  setForm,
  onSubmit,
  error,
}: {
  form: { company: string; url: string };
  setForm: (f: typeof form) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
}) {
  const input =
    "w-full rounded-xl border border-line bg-black/60 px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-brand-light focus:ring-2 focus:ring-brand/40";
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-panel p-6 shadow-2xl shadow-brand/10 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/60">Firmenname</span>
          <input required className={input} placeholder="z. B. Muster Immobilier S.à r.l." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/60">Website</span>
          <input required className={input} placeholder="www.deine-firma.lu" inputMode="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      <button className="mt-6 w-full rounded-full bg-brand px-6 py-4 text-lg font-semibold text-white transition hover:bg-brand-light">
        Kostenlose Analyse starten →
      </button>
      <p className="mt-3 text-center text-xs text-white/40">Dauert ca. 30 Sekunden · Wir analysieren nur öffentlich sichtbare Daten</p>
    </form>
  );
}

/* ------------------------------------------------------------------ Scan-Animation */

function Scanning({ company }: { company: string }) {
  const steps = [
    `Website von ${company || "deiner Firma"} wird geladen`,
    "Branche & Angebot werden erkannt",
    "Aktive Kampagnen auf Facebook & Instagram werden gesucht",
    "Google Ads in Luxemburg werden geprüft",
    "Sichtbarkeit & Google-Bewertungen werden geprüft",
    "Ladezeit auf Smartphones wird gemessen",
    "Tracking & Retargeting-Pixel werden erkannt",
    "Funnel, Landingpages & Einstiegsangebot werden analysiert",
    "Sprachversionen FR / DE / EN werden geprüft",
    "Potenzial für ganz Luxemburg wird berechnet",
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 2200);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8">
      <p className="text-sm uppercase tracking-widest text-brand-light">Analyse läuft</p>
      <h2 className="mt-2 text-2xl font-bold">Wir durchleuchten gerade dein Online-Marketing …</h2>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-brand transition-all duration-[2000ms]" style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 text-sm transition ${i > active ? "text-white/25" : "text-white/90"}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${i < active ? "bg-brand text-white" : i === active ? "pulse-dot bg-brand-light" : "bg-white/10"}`}>
              {i < active ? "✓" : ""}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ Ergebnis */

function Result({
  teaser,
  report,
  onUnlock,
  onRestart,
}: {
  teaser: Teaser;
  report: FullReport | null;
  onUnlock: (r: FullReport) => void;
  onRestart: () => void;
}) {
  const locked = !report;
  const p = report?.potential;
  const findings: (Omit<Finding, "recommendation"> & { recommendation?: string })[] = report ? report.findings : teaser.previewFindings;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-widest text-brand-light">Ergebnis</p>
          <h2 className="text-2xl font-bold sm:text-3xl">
            {teaser.company} <span className="text-white/40">· {teaser.domain}</span>
          </h2>
          <p className="text-sm text-white/50">Erkannte Branche: {teaser.industryLabel} · Markt: ganz Luxemburg</p>
        </div>
        <button onClick={onRestart} className="text-sm text-white/50 underline-offset-4 hover:text-white hover:underline">
          Andere Firma prüfen
        </button>
      </div>

      {/* Score + Potenzial */}
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-panel p-6">
          <ScoreRing score={teaser.score} />
          <p className="mt-3 text-sm text-white/60">Marketing-Score</p>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-6">
          <p className="text-sm text-white/60">Ungenutztes Potenzial in Luxemburg</p>
          <p className="mt-1 text-4xl font-extrabold text-brand-light sm:text-5xl">{teaser.potentialPercent} %</p>
          <PotentialBar percent={teaser.potentialPercent} />
          <p className="mt-4 text-sm text-white/60">
            Ca. <strong className="text-white">{num(teaser.monthlySearches)}</strong> Menschen suchen jeden Monat in Luxemburg nach{" "}
            {teaser.industryLabel}. Die meisten davon finden dich nicht.
          </p>
        </div>
      </div>

      {/* Geldzahlen */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Interessenten, die dich nicht finden / Monat" value={p ? num(p.missedPeopleMonth) : "2.300"} locked={locked} />
          <StatCard label="Deine Anfragen heute / Monat (geschätzt)" value={p ? num(Math.round(p.currentLeadsMonth)) : "9"} locked={locked} />
          <StatCard label="Verpasste Anfragen / Monat" value={p ? num(p.lostLeadsMonth) : "71"} locked={locked} highlight />
          <StatCard label="Verpasste Anfragen / Jahr" value={p ? num(p.lostLeadsYear) : "852"} locked={locked} highlight />
        </div>
      </div>

      {locked && <Gate token={teaser.token} lockedCount={teaser.lockedFindingsCount} onUnlock={onUnlock} />}

      {/* Kategorien */}
      <div className="rounded-3xl border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold">Dein Profil im Überblick</h3>
        <div className="mt-4 space-y-4">
          {teaser.categories.map((c) => (
            <div key={c.id}>
              <div className="flex justify-between text-sm">
                <span>{c.label}</span>
                <span className="text-white/60">{c.score === null ? "nicht geprüft" : `${c.score}/100`}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${barColor(c.score)}`} style={{ width: `${c.score ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Befunde */}
      <div className="rounded-3xl border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold">Wo dir Anfragen verloren gehen</h3>
        <div className="mt-4 space-y-4">
          {findings.map((f) => (
            <div key={f.id} className="rounded-2xl border border-line bg-black/40 p-5">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:gap-3">
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0">
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-white/65">{f.detail}</p>
                  {f.recommendation ? (
                    <p className="mt-3 rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-white/90">
                      <strong className="text-brand-light">So holst du es zurück: </strong>
                      {f.recommendation}
                    </p>
                  ) : (
                    <p className="locked mt-3 rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm" aria-hidden>
                      So holst du es zurück: Mit einer gezielten Kampagne und einer eigenen Landingpage kannst du diesen Kanal innerhalb weniger Wochen erschließen.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {locked &&
            Array.from({ length: teaser.lockedFindingsCount }).map((_, i) => (
              <div key={i} className="locked rounded-2xl border border-line bg-black/40 p-5" aria-hidden>
                <p className="font-semibold">Weiterer Befund, der dich Anfragen kostet</p>
                <p className="mt-1 text-sm text-white/65">Hier steht, was genau fehlt, warum es dich Kunden kostet und wie viel ungefähr.</p>
              </div>
            ))}
        </div>
      </div>

      {/* Checks */}
      <div className="rounded-3xl border border-line bg-panel p-6">
        <h3 className="text-lg font-semibold">Alle Prüfpunkte</h3>
        <ul className="mt-4 divide-y divide-line">
          {teaser.checks.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </ul>
      </div>

      {report && (
        <>
          <div className="rounded-3xl border border-brand/40 bg-gradient-to-br from-brand/25 to-transparent p-6 text-center sm:p-10">
            <h3 className="text-2xl font-bold sm:text-3xl">Wir holen dir dieses Potenzial zurück.</h3>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Wir bauen dir ein Performance-Marketing-System, das planbar qualifizierte Anfragen bringt: Strategie & Angebot, Kampagnen auf Meta und Google, Landingpages, Tracking und
              Retargeting, alles aus einer Hand. Im kostenlosen Strategiegespräch zeigen wir dir, wie wir die {num(report.potential.lostLeadsMonth)} verpassten Anfragen pro Monat konkret
              zurückholen.
            </p>
            {BOOKING_URL && (
              <a href={BOOKING_URL} target="_blank" rel="noopener" className="mt-6 inline-block rounded-full bg-brand px-8 py-4 font-semibold transition hover:bg-brand-light">
                Kostenloses Strategiegespräch buchen →
              </a>
            )}
            <p className="mt-3 text-xs text-white/40">Den kompletten Report haben wir dir zusätzlich per E-Mail geschickt.</p>
          </div>
          <div className="text-xs text-white/40">
            <p className="font-semibold">So haben wir gerechnet (Schätzung):</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {report.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Gate({ token, lockedCount, onUnlock }: { token: string; lockedCount: number; onUnlock: (r: FullReport) => void }) {
  const [data, setData] = useState({ name: "", email: "", phone: "", consent: false, website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input =
    "w-full rounded-xl border border-line bg-black/60 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-brand-light focus:ring-2 focus:ring-brand/40";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler");
      onUnlock(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border-2 border-brand bg-panel p-6 shadow-2xl shadow-brand/20 sm:p-8">
      <p className="text-sm uppercase tracking-widest text-brand-light">🔒 Vollständigen Report freischalten</p>
      <h3 className="mt-2 text-2xl font-bold">Sieh, wie viele Anfragen du jeden Monat verpasst und wie du sie zurückholst</h3>
      <p className="mt-2 text-sm text-white/60">
        Du bekommst sofort alle Zahlen, {lockedCount > 0 ? `${lockedCount} weitere Befunde, ` : ""}konkrete Empfehlungen für jeden Punkt und den Report per E-Mail.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <input required className={input} placeholder="Dein Name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        <input required type="email" className={input} placeholder="E-Mail" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        <input type="tel" className={input} placeholder="Telefon (optional)" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
      </div>
      <input tabIndex={-1} autoComplete="off" className="hidden" value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} aria-hidden />
      <label className="mt-4 flex items-start gap-3 text-xs text-white/60">
        <input required type="checkbox" className="mt-0.5 accent-[#0b6bb0]" checked={data.consent} onChange={(e) => setData({ ...data, consent: e.target.checked })} />
        <span>
          Ich bin einverstanden, dass meine Angaben zur Zusendung des Reports und zur Kontaktaufnahme bezüglich meiner Analyse verwendet werden. Details in der{" "}
          <a href="/datenschutz" target="_blank" className="underline">
            Datenschutzerklärung
          </a>
          . Widerruf jederzeit möglich.
        </span>
      </label>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="mt-5 w-full rounded-full bg-brand px-6 py-4 text-lg font-semibold transition hover:bg-brand-light disabled:opacity-60">
        {busy ? "Wird freigeschaltet …" : "Ergebnis jetzt freischalten →"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ Bausteine */

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#1d232c" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold">{score}</span>
        <span className="text-xs text-white/50">von 100</span>
      </div>
    </div>
  );
}

function PotentialBar({ percent }: { percent: number }) {
  const used = 100 - percent;
  return (
    <div className="mt-4">
      <div className="flex h-5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-white/70" style={{ width: `${used}%` }} />
        <div className="h-full bg-[repeating-linear-gradient(45deg,#0b6bb0_0_10px,#3d9be3_10px_20px)]" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/50">
        <span>Genutzt: {used} %</span>
        <span className="text-brand-light">Noch rauszuholen: {percent} %</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, locked, highlight }: { label: string; value: string; locked: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-brand/50 bg-brand/10" : "border-line bg-panel"}`}>
      <p className="text-xs text-white/60">{label}</p>
      <p className={`mt-2 text-xl font-extrabold sm:text-3xl ${highlight ? "text-brand-light" : ""} ${locked ? "locked" : ""}`} aria-hidden={locked}>
        {value}
      </p>
    </div>
  );
}

const STATUS_STYLE: Record<Status, { icon: string; cls: string }> = {
  good: { icon: "✓", cls: "bg-green-500/15 text-green-400" },
  warn: { icon: "!", cls: "bg-amber-500/15 text-amber-400" },
  bad: { icon: "✕", cls: "bg-red-500/15 text-red-400" },
  unknown: { icon: "?", cls: "bg-white/10 text-white/50" },
};

function CheckRow({ check }: { check: Check }) {
  const s = STATUS_STYLE[check.status];
  return (
    <li className="flex items-center gap-3 py-3 text-sm">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.cls}`}>{s.icon}</span>
      <span className="flex-1">{check.label}</span>
      <span className="text-right text-white/55">{check.value}</span>
    </li>
  );
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const map = {
    high: ["Kritisch", "bg-red-500/15 text-red-400"],
    medium: ["Wichtig", "bg-amber-500/15 text-amber-400"],
    low: ["Hinweis", "bg-white/10 text-white/60"],
  } as const;
  const [label, cls] = map[severity];
  return <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function barColor(score: number | null) {
  if (score === null) return "bg-white/20";
  if (score >= 70) return "bg-green-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}
