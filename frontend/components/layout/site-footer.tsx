import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { brand, footerLinks, legalLinks, socialLinks } from "@/lib/content";
import { productTypeLinks } from "@/lib/seo-categories";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/icons/social-icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#1A1714] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.55fr_0.55fr_0.7fr_0.55fr_0.55fr] lg:px-8">
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

        {/* The Shop section is deliberately limited to just the two primary,
            client-mandated categories — Stitched/Ready-made and Unstitched —
            so this top-level split stays the single clear entry point into
            the catalog rather than competing with garment-type links. */}
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Shop</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-300">
            {productTypeLinks.map((link) => (
              <li key={link.slug}>
                <Link href={`/collections?type=${link.slug}`} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Store Location</p>
          <p className="mt-4 text-sm leading-7 text-gray-300">
            RUBYZ-ENSEMBLE<br />
            Plot no 93,<br />
            Home-Town Road,<br />
            near Prayash Park,<br />
            Satya Nagar,<br />
            Bhubaneswar- 751007
          </p>
          <a
            href="https://maps.google.com/?q=RUBYZ-ENSEMBLE+Boutique+Home-Town+Road+Satya+Nagar+Bhubaneswar"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-[#B68D40] underline underline-offset-4 transition hover:text-white"
          >
            View on Google Maps
          </a>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Follow Us</p>
          <div className="mt-4 flex gap-3">
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="rounded-full border border-white/20 p-2 text-white transition hover:border-white/40"
            >
              <FacebookIcon size={16} />
            </a>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-white/20 p-2 text-white transition hover:border-white/40"
            >
              <InstagramIcon size={16} />
            </a>
            <a
              href={socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="rounded-full border border-white/20 p-2 text-white transition hover:border-white/40"
            >
              <YoutubeIcon size={16} />
            </a>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="rounded-full border border-white/20 p-2 text-white transition hover:border-white/40"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#B68D40]">Legal</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-300">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Slim compliance strip — just the copyright line now; the legal
          pages themselves live in the "Legal" column above so they're not
          duplicated down here. */}
      <div className="border-t border-white/10">
        <div className="mx-auto px-5 py-5 text-center text-xs text-gray-500 lg:px-8">
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
