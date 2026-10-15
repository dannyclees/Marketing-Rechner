import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Marketing-Potenzial-Rechner Luxemburg",
  description:
    "Finde in 30 Sekunden heraus, wie viele Kunden und wie viel Umsatz dir in Luxemburg durch fehlendes Online-Marketing entgehen.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
