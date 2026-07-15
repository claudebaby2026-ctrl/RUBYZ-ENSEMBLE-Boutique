import type { Metadata } from "next";
import { Playfair_Display, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rubyzensemble.in"),
  title: {
    default: "RUBYZ Ensemble | Luxury Ethnic Fashion Boutique",
    template: "%s | RUBYZ Ensemble",
  },
  description:
    "Luxury ethnic fashion boutique in Bhubaneswar offering premium collections, tailoring services, and elegant styling.",
  keywords: ["ethnic fashion", "boutique", "pakistani suits", "tailoring", "luxury fashion"],
  openGraph: {
    title: "RUBYZ Ensemble",
    description: "Luxury ethnic fashion boutique in Bhubaneswar",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUBYZ Ensemble",
    description: "Luxury ethnic fashion boutique in Bhubaneswar",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-[#FBFAF8] text-[#111111] antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
