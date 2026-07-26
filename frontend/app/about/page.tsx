import { MapPin, Star, Truck, Users, ExternalLink, MessageCircle } from "lucide-react";
import { brand, googleReviewsUrl, socialLinks } from "@/lib/content";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/icons/social-icons";

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
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#3A2213] p-8 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Our Story</p>
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
                  <span className="w-16 shrink-0 text-xs uppercase tracking-[0.24em] text-[#B17F5E]">{item.year}</span>
                  <p className="text-sm leading-6 text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-[1rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#B17F5E]" />
                <div>
                  <p className="text-sm font-semibold text-[#3A2213]">Visit the boutique</p>
                  <p className="mt-1 text-sm text-[#7A6D65]">Satyanagar, near Prayash Park, Bhubaneswar, Odisha</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4">
                <Star size={18} className="mt-0.5 shrink-0 text-[#B17F5E]" />
                <div>
                  <p className="text-sm font-semibold text-[#3A2213]">5-star rated</p>
                  <p className="mt-1 text-sm text-[#7A6D65]">Rated by real customers on Google — not a marketing claim.</p>
                  <a
                    href={googleReviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#B17F5E] hover:underline"
                  >
                    See our Google Reviews <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4">
                <Truck size={18} className="mt-0.5 shrink-0 text-[#B17F5E]" />
                <div>
                  <p className="text-sm font-semibold text-[#3A2213]">Pan-India delivery</p>
                  <p className="mt-1 text-sm text-[#7A6D65]">The Bhubaneswar boutique experience, shipped nationwide.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4">
                <Users size={18} className="mt-0.5 shrink-0 text-[#B17F5E]" />
                <div>
                  <p className="text-sm font-semibold text-[#3A2213]">Founder-led</p>
                  <p className="mt-1 text-sm text-[#7A6D65]">Run by Ruby Hans and a close-knit team who know the collection by heart.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {values.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-[#3A2213]/8 bg-[#E9CFBA] p-4">
                  <p className="text-sm font-semibold text-[#3A2213]">{item.title}</p>
                  <p className="mt-2 text-sm text-[#7A6D65]">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1rem] border border-dashed border-[#B17F5E]/40 bg-[#FFFBF5] p-5">
              <p className="text-sm text-[#7A6D65]">
                Have a question before you order? Reach the team directly on{" "}
                <span className="font-semibold text-[#3A2213]">78730-11110</span> (11am – 8pm), or follow{" "}
                <span className="font-semibold text-[#3A2213]">@rubyz.ensemble</span> for the latest arrivals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8 lg:pb-16">
        <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-8 shadow-sm lg:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Founder&apos;s Message</p>
          <h2 className="mt-3 text-2xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
            Hello, beautiful ladies.
          </h2>

          <div className="mt-5 space-y-4 text-sm leading-7 text-[#7A6D65] lg:max-w-3xl">
            <p>
              Thank you for visiting my page. I am Ruby Hans. A small brief about my business — we deal mainly
              in unstitched and readymade women&apos;s wear only.
            </p>
            <p>
              Our premium collection is outsourced from India&apos;s best manufacturers and distributors. Each
              suit piece, whether unstitched or ready-made, is carefully hand-picked so that the best design and
              quality is assured.
            </p>
            <p>
              Our suits are available at unbelievable, pocket-friendly prices — always 40% to 60% lower than
              regular market price. Kaftan, Pakistani, Zardozi, Brush Paint, Pure Muslin, Silk and Cotton,
              Embroidery and many designer collections are available. No design is ever repeated. Popular brands
              like Ganga, Jai Vijay and Saiba are also available.
            </p>
            <p>
              We also provide Pan-India delivery, tailoring services, and international shipping too. Please
              check our reviews on Google at{" "}
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#B17F5E] hover:underline"
              >
                Rubyz Ensemble, Bhubaneswar
              </a>
              .
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[#3A2213]/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#3A2213]">
              Please join us for the latest updates on WhatsApp, YouTube, Facebook and Instagram.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join us on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A2213]/8 bg-[#E9CFBA] text-[#3A2213] transition hover:bg-[#B17F5E] hover:text-white"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe on YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A2213]/8 bg-[#E9CFBA] text-[#3A2213] transition hover:bg-[#B17F5E] hover:text-white"
              >
                <YoutubeIcon size={16} />
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A2213]/8 bg-[#E9CFBA] text-[#3A2213] transition hover:bg-[#B17F5E] hover:text-white"
              >
                <FacebookIcon size={16} />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A2213]/8 bg-[#E9CFBA] text-[#3A2213] transition hover:bg-[#B17F5E] hover:text-white"
              >
                <InstagramIcon size={16} />
              </a>
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
            Awaiting to connect! — Ruby Hans
          </p>
        </div>
      </section>
    </main>
  );
}
