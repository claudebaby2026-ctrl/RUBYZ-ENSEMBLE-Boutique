import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Tailoring",
  description: "Explore custom tailoring services and measurement-led styling at RUBYZ Ensemble.",
};

export default function TailoringPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Custom Tailoring</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Tailored to your frame, shaped to your story.</h1>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Our atelier offers bespoke alterations, custom fitting, and styling guidance for a seamless luxury experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white">Book an Appointment</button>
              <button className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium text-[#111111]">WhatsApp Us</button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-[#111111] p-8 text-white">
            <div className="h-64 rounded-[1.4rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
            <div className="mt-6 grid gap-3 text-sm text-gray-300">
              {['Neck adjustments','Sleeve refinement','Length tailoring','Waist shaping'].map((item) => (
                <div key={item} className="rounded-[1rem] border border-white/10 bg-white/5 p-3">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
