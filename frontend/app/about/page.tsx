import { brand } from "@/lib/content";

export const metadata = {
  title: "About",
  description: "The founder story and boutique values behind RUBYZ Ensemble.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/5 bg-[#111111] p-8 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Our Story</p>
            <h1 className="mt-3 text-3xl" style={{ fontFamily: "Playfair Display, serif" }}>Crafted with warmth, worn with confidence.</h1>
            <p className="mt-5 text-sm leading-7 text-gray-300">
              {brand.name} began as a celebration of premium ethnic fashion that feels timeless, personal, and deeply rooted in the city of Bhubaneswar.
            </p>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <div className="h-64 rounded-[1.4rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { title: "Premium curation", body: "Every collection is handpicked and styled with care." },
                { title: "Tailoring-first", body: "Silhouettes are refined for comfort and confidence." },
                { title: "Trusted service", body: "A concierge experience from browse to delivery." },
              ].map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-black/5 bg-[#F8F5F1] p-4">
                  <p className="text-sm font-semibold text-[#111111]">{item.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
