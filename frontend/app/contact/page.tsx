import { MapPin, Phone, MessageCircle } from "lucide-react";
import { legalEntity, SITE_URL } from "@/lib/content";

export const metadata = {
  title: "Contact",
  description: "Get in touch with RUBYZ Ensemble for styling, tailoring and concierge support.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

// Google Maps embed via the query-string form (maps.google.com/maps?q=...
// &output=embed) — no API key required, unlike the JS Maps Embed API.
// NOTE: swap the `q` value for the real address once the Google Business
// Profile listing (SEO plan §6) is set up, so the pin matches exactly.
const MAP_QUERY = encodeURIComponent(legalEntity.address);
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${MAP_QUERY}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

export default function ContactPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Visit or Connect</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>We would love to welcome you.</h1>
            <div className="mt-8 space-y-4 text-sm text-gray-600">
              {/* NAP (Name/Address/Phone) as real, crawlable page text —
                  kept byte-for-byte consistent with the Google Business
                  Profile listing and the ClothingStore JSON-LD in
                  app/layout.tsx (SEO plan §6, §8). */}
              <div className="flex gap-3"><MapPin size={16} className="mt-1 text-[#B68D40]" /><span>{legalEntity.address}</span></div>
              <div className="flex gap-3"><Phone size={16} className="mt-1 text-[#B68D40]" /><a href={`tel:${legalEntity.phone.replace(/\s+/g, "")}`}>{legalEntity.phone}</a></div>
              <div className="flex gap-3"><MessageCircle size={16} className="mt-1 text-[#B68D40]" /><a href={`mailto:${legalEntity.email}`}>{legalEntity.email}</a></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-[#111111] p-8 text-white shadow-sm">
            <div className="h-64 overflow-hidden rounded-[1.4rem]">
              <iframe
                title="RUBYZ Ensemble location"
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-6 text-sm text-gray-300">
              <p>Business Hours</p>
              <p className="mt-2">Mon–Sat · 11:00 AM – 8:00 PM</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
