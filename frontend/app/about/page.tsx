import { MapPin, Star, Truck, Users } from "lucide-react";
import { brand } from "@/lib/content";

export const metadata = {
  title: "About",
  description: "The founder story and boutique values behind RUBYZ Ensemble Boutique, Satyanagar, Bhubaneswar.",
};

const milestones = [
  { year: "2022", text: "Ruby Hans brings a few suits from her hometown, Jamshedpur, to Bhubaneswar as gifts for family — and the requests don't stop." },
  { year: "2023–24", text: "Ruby travels to Delhi, Mumbai, Lucknow, Surat and Punjab, building direct relationships with manufacturers to cut out the middlemen." },
  { year: "2025", text: "RUBYZ Ensemble officially launches in Satyanagar, Bhubaneswar, with a clear purpose: premium ethnic wear at honest prices." },
  { year: "Today", text: "A five-star-rated boutique with pan-India delivery, still run with the same personal, made-to-feel-seen approach it started with." },
];

const values = [
  { title: "Premium curation", body: "Every collection is handpicked and directly sourced from trusted manufacturers, so quality never gets diluted by middlemen." },
  { title: "Honest pricing", body: "The gap Ruby noticed in 2022 — the same quality costing double in Bhubaneswar — is exactly what RUBYZ set out to close." },
  { title: "Personal styling", body: "Browsing feels personal, not transactional. The team guides you to pieces that fit your occasion and your personality." },
];

export default function AboutPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/5 bg-[#111111] p-8 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Our Story</p>
            <h1 className="mt-3 text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>
              Crafted with warmth, worn with confidence.
            </h1>
            <p className="mt-5 text-sm leading-7 text-gray-300">
              {brand.name} began not as a business plan, but as a simple gesture — founder Ruby Hans carrying a
              few suits from her hometown of Jamshedpur to Bhubaneswar as gifts for family. When more requests
              followed, she noticed a gap: the same quality available elsewhere in India was selling in
              Bhubaneswar for nearly double. She set out to close it.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Ruby travelled across Delhi, Mumbai, Lucknow, Surat and Punjab, studying the market and building
              direct relationships with manufacturers who could deliver genuine quality without unnecessary
              markups. That groundwork became the foundation RUBYZ Ensemble stands on today — officially
              launched in 2025, and now a five-star-rated destination for the women of Bhubaneswar.
            </p>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
              {milestones.map((item) => (
                <div key={item.year} className="flex gap-4">
                  <span className="w-16 shrink-0 text-xs uppercase tracking-[0.24em] text-[#B68D40]">{item.year}</span>
                  <p className="text-sm leading-6 text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#B68D40]" />
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Visit the boutique</p>
                  <p className="mt-1 text-sm text-gray-600">Satyanagar, near Prayash Park, Bhubaneswar, Odisha</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                <Star size={18} className="mt-0.5 shrink-0 text-[#B68D40]" />
                <div>
                  <p className="text-sm font-semibold text-[#111111]">5-star rated</p>
                  <p className="mt-1 text-sm text-gray-600">Rated by real customers on Google — not a marketing claim.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                <Truck size={18} className="mt-0.5 shrink-0 text-[#B68D40]" />
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Pan-India delivery</p>
                  <p className="mt-1 text-sm text-gray-600">The Bhubaneswar boutique experience, shipped nationwide.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                <Users size={18} className="mt-0.5 shrink-0 text-[#B68D40]" />
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Founder-led</p>
                  <p className="mt-1 text-sm text-gray-600">Run by Ruby Hans and a close-knit team who know the collection by heart.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {values.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                  <p className="text-sm font-semibold text-[#111111]">{item.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1rem] border border-dashed border-[#B68D40]/40 bg-white p-5">
              <p className="text-sm text-gray-600">
                Have a question before you order? Reach the team directly on{" "}
                <span className="font-semibold text-[#111111]">78730-11110</span> (11am – 8pm), or follow{" "}
                <span className="font-semibold text-[#111111]">@rubyz.ensemble</span> for the latest arrivals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}