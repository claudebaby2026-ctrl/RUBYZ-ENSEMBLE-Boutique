"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { brand } from "@/lib/content";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";

const navItems = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/tailoring", label: "Tailoring" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link href="/cart" className="relative rounded-full border border-black/10 p-2" aria-label="Cart">
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D94F70] px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full border border-black/10 p-2"
              aria-label="Account"
            >
              <User size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-[1rem] border border-black/5 bg-white p-2 shadow-lg">
                {user ? (
                  <>
                    <p className="truncate px-3 py-2 text-xs text-gray-500">
                      Signed in as <span className="text-[#111111]">{user.name}</span>
                    </p>
                    {user.role === "owner" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-[0.7rem] px-3 py-2 text-sm hover:bg-[#F8F5F1]"
                      >
                        Owner Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[0.7rem] px-3 py-2 text-left text-sm text-[#D94F70] hover:bg-[#F8F5F1]"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-[0.7rem] px-3 py-2 text-sm hover:bg-[#F8F5F1]"
                  >
                    Sign in / Create account
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
