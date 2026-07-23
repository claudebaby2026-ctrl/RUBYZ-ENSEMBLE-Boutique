import type { Metadata } from "next";
import { Playfair_Display, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { legalEntity, SITE_URL } from "@/lib/content";

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
    // Site-wide fallback so the homepage and any page without its own
    // generateMetadata() (e.g. /collections, /about) still shows a preview
    // image on WhatsApp/Instagram/Pinterest shares instead of a blank card.
    // Product and category pages override this with their own image via
    // their own generateMetadata(). Replace public/og-image.jpg with real
    // brand photography when available — this is a placeholder.
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "RUBYZ Ensemble — Luxury Ethnic Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUBYZ Ensemble",
    description: "Luxury ethnic fashion boutique in Bhubaneswar",
    images: ["/og-image.jpg"],
  },
};

// Site-wide LocalBusiness structured data (SEO plan §4a). Uses the
// ClothingStore subtype (rather than generic Organization) since that's
// what makes the site eligible for the local "map pack" on "boutique near
// me" style searches.

const clothingStoreJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "RUBYZ Ensemble",
  url: SITE_URL,
  telephone: legalEntity.phone,
  email: legalEntity.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: legalEntity.streetAddress,
    addressLocality: legalEntity.addressLocality,
    addressRegion: legalEntity.addressRegion,
    postalCode: legalEntity.postalCode,
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 20.281671804720553,
    longitude: 85.84590634595567,
  },
  priceRange: "₹₹-₹₹₹",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "11:00",
      closes: "20:00",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-[#FBFAF8] text-[#111111] antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(clothingStoreJsonLd) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
