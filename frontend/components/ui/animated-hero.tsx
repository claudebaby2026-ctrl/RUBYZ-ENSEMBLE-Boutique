"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/content";

export function AnimatedHero({
  heading,
  subheading,
}: {
  heading?: string;
  subheading?: string;
} = {}) {
  return (
    <section className="grid gap-6 rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(17,17,17,0.06)] sm:gap-8 sm:rounded-[2rem] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center"
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#B68D40] sm:mb-4 sm:text-xs sm:tracking-[0.35em]">New Festive Collection</p>
        <h1 className="mb-4 text-3xl leading-tight text-[#111111] sm:mb-6 sm:text-5xl lg:text-6xl">{heading || "Luxury ethnic fashion for every occasion."}</h1>
        <p className="mb-6 max-w-xl text-sm leading-6 text-gray-600 sm:mb-8 sm:text-base sm:leading-7">{subheading || `Discover handpicked silhouettes, premium fabrics, and concierge-level styling from the home of ${brand.name}.`}</p>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Link href="/collections" className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-medium text-white transition hover:translate-y-[-2px] sm:px-6 sm:py-3">Shop Now <ArrowRight size={16} /></Link>
          <Link href="/tailoring" className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-5 py-2.5 text-sm font-medium text-[#111111] transition hover:border-[#B68D40] sm:px-6 sm:py-3"><Sparkles size={16} /> Tailoring Services</Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-[200px] overflow-hidden rounded-[1.2rem] bg-[#F8F5F1] sm:min-h-[300px] sm:rounded-[1.5rem] lg:min-h-[360px]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(182,141,64,0.16),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#111111_0%,_#2f2f2f_55%,_#F8F5F1_100%)] opacity-80" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#F8F5F1] sm:mb-3 sm:text-xs sm:tracking-[0.35em]">Boutique Edit 2026</p>
          <h2 className="max-w-sm text-xl text-white sm:text-3xl">Handpicked heirloom-inspired garments for celebration and everyday elegance.</h2>
        </div>
      </motion.div>
    </section>
  );
}
