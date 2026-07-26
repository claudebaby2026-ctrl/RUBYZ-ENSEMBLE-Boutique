import { TailoringActions } from "@/components/tailoring/tailoring-actions";

export const metadata = {
  title: "Tailoring",
  description: "Explore custom tailoring services and measurement-led styling at RUBYZ Ensemble.",
};

export default function TailoringPage() {
  return (
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8">
          <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B17F5E]">Custom Tailoring</p>
            <h1 className="mt-3 text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>Tailored to your frame, shaped to your story.</h1>
            <p className="mt-5 text-sm leading-7 text-[#7A6D65]">
              Our atelier offers bespoke alterations, custom fitting, and styling guidance for a seamless luxury experience.
            </p>
            <TailoringActions />
          </div>
        </div>
      </section>
    </main>
  );
}