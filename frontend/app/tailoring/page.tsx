import { TailoringActions } from "@/components/tailoring/tailoring-actions";

export const metadata = {
  title: "Tailoring",
  description: "Explore custom tailoring services and measurement-led styling at RUBYZ Ensemble.",
};

export default function TailoringPage() {
  return (
    <main className="bg-[#F3EEE6]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8">
          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Custom Tailoring</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Tailored to your frame, shaped to your story.</h1>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Our atelier offers bespoke alterations, custom fitting, and styling guidance for a seamless luxury experience.
            </p>
            <TailoringActions />
          </div>
        </div>
      </section>
    </main>
  );
}