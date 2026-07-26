import Link from "next/link";
import { legalLinks } from "@/lib/content";

export type LegalSection = {
  heading: string;
  body: React.ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="bg-[#FDF2EC]">
      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="rounded-[2rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#B17F5E]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl text-[#3A2213]" style={{ fontFamily: "Playfair Display, serif" }}>
            {title}
          </h1>
          <p className="mt-2 text-xs text-[#A8968A]">Last updated: {updated}</p>

          {intro && <div className="mt-6 space-y-4 text-sm leading-7 text-[#7A6D65]">{intro}</div>}

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-base font-semibold text-[#3A2213]">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-[#7A6D65]">{section.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#3A2213]/8 pt-6 text-xs uppercase tracking-[0.2em] text-[#A8968A]">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#B17F5E]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
