"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, Menu } from "lucide-react";
import { brand } from "@/lib/content";

const navItems = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/tailoring", label: "Tailoring" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button className="rounded-full border border-black/10 p-2 lg:hidden" aria-label="Open menu">
          <Menu size={18} />
        </button>

        <Link href="/" className="text-2xl tracking-wide text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
          {brand.name.split(" ")[0]} <span className="italic text-[#B68D40]">{brand.name.split(" ")[1]}</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] uppercase tracking-[0.26em] transition ${isActive ? "text-[#B68D40]" : "text-[#111111] hover:text-[#B68D40]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-black/10 p-2" aria-label="Search">
            <Search size={18} />
          </button>
          <button className="rounded-full border border-black/10 p-2" aria-label="Wishlist">
            <Heart size={18} />
          </button>
          <Link href="/cart" className="rounded-full border border-black/10 p-2" aria-label="Cart">
            <ShoppingBag size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
