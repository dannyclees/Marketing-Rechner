const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "CE Marketing";

export const metadata = { title: "Datenschutz" };

// TODO: Durch die echte, rechtlich geprüfte Datenschutzerklärung ersetzen.
export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-white/80">
      <h1 className="text-3xl font-bold text-white">Datenschutzerklärung</h1>
      <p className="mt-6">
        Platzhalter: Hier muss die vollständige Datenschutzerklärung von {BRAND} stehen (Verantwortlicher, Zweck der Verarbeitung, Rechtsgrundlage nach DSGVO,
        Speicherdauer, Empfänger wie E-Mail-Dienstleister und Datenbank-Hosting, Rechte der Betroffenen, Beschwerderecht bei der CNPD Luxemburg).
      </p>
      <p className="mt-4">
        Für die Analyse werden ausschließlich öffentlich zugängliche Informationen der angegebenen Website sowie öffentlicher Google-Dienste abgerufen.
      </p>
      <a href="/" className="mt-8 inline-block text-brand-light underline">
        Zurück zum Rechner
      </a>
    </main>
  );
}
