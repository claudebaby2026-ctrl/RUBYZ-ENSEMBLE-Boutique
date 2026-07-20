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
    <section className="grid gap-8 rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_20px_60px_rgba(17,17,17,0.06)] lg:grid-cols-[1.1fr_0.9fr] lg:p-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center"
      >
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#B68D40]">New Festive Collection</p>
        <h1 className="mb-6 text-4xl leading-tight text-[#111111] sm:text-5xl lg:text-6xl">{heading || "Luxury ethnic fashion for every occasion."}</h1>
        <p className="mb-8 max-w-xl text-base leading-7 text-gray-600">{subheading || `Discover handpicked silhouettes, premium fabrics, and concierge-level styling from the home of ${brand.name}.`}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/collections" className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white transition hover:translate-y-[-2px]">Shop Now <ArrowRight size={16} /></Link>
          <Link href="/tailoring" className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-6 py-3 text-sm font-medium text-[#111111] transition hover:border-[#B68D40]"><Sparkles size={16} /> Tailoring Services</Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] bg-[#F8F5F1]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(182,141,64,0.16),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#111111_0%,_#2f2f2f_55%,_#F8F5F1_100%)] opacity-80" />
        <div className="absolute inset-x-0 bottom-0 p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#F8F5F1]">Boutique Edit 2026</p>
          <h2 className="max-w-sm text-3xl text-white">Handpicked heirloom-inspired garments for celebration and everyday elegance.</h2>
        </div>
      </motion.div>
    </section>
  );
}
