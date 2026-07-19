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
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
            {title}
          </h1>
          <p className="mt-2 text-xs text-gray-400">Last updated: {updated}</p>

          {intro && <div className="mt-6 space-y-4 text-sm leading-7 text-gray-600">{intro}</div>}

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-base font-semibold text-[#111111]">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">{section.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/5 pt-6 text-xs uppercase tracking-[0.2em] text-gray-400">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#B68D40]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
