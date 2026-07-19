import Link from "next/link";
import { Camera, MessageCircle, PhoneCall } from "lucide-react";
import { brand, footerLinks, legalLinks } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#111111] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">RUBYZ Ensemble</p>
          <h2 className="mt-3 text-2xl text-white" style={{ fontFamily: "Playfair Display, serif" }}>
            A boutique experience rooted in craftsmanship and grace.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-gray-400">
            From premium ethnicwear to tailoring and styling, every interaction is designed to feel intimate, elegant, and effortless.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Explore</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-300">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Visit</p>
          <p className="mt-4 text-sm leading-7 text-gray-300">
            Plot 42, Janpath Lane, Bhubaneswar<br />
            +91 78730 11110<br />
            hello@rubyzensemble.in
          </p>
          <div className="mt-6 flex gap-3">
            <a href="https://instagram.com" aria-label="Instagram" className="rounded-full border border-white/20 p-2 text-white">
              <Camera size={16} />
            </a>
            <a href="https://wa.me/919876543210" aria-label="WhatsApp" className="rounded-full border border-white/20 p-2 text-white">
              <MessageCircle size={16} />
            </a>
            <a href="tel:+919876543210" aria-label="Phone" className="rounded-full border border-white/20 p-2 text-white">
              <PhoneCall size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Slim compliance strip — keeps Privacy/Terms/Shipping/Refund policy
          pages accessible from every page (required for Razorpay & Shiprocket
          verification) without competing for space with the main footer nav. */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-3 px-5 py-5 text-xs text-gray-500 sm:flex-row sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
