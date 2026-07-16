import { MapPin, Phone, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Contact",
  description: "Get in touch with RUBYZ Ensemble for styling, tailoring and concierge support.",
};

export default function ContactPage() {
  return (
    <main className="bg-[#FBFAF8]">
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">Visit or Connect</p>
            <h1 className="mt-3 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>We would love to welcome you.</h1>
            <div className="mt-8 space-y-4 text-sm text-gray-600">
              <div className="flex gap-3"><MapPin size={16} className="mt-1 text-[#B68D40]" /><span>Plot 42, Janpath Lane, Bhubaneswar</span></div>
              <div className="flex gap-3"><Phone size={16} className="mt-1 text-[#B68D40]" /><span>+91 78730 11110</span></div>
              <div className="flex gap-3"><MessageCircle size={16} className="mt-1 text-[#B68D40]" /><span>hello@rubyzensemble.in</span></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-[#111111] p-8 text-white shadow-sm">
            <div className="h-64 rounded-[1.4rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
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
