"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { brand } from "@/lib/content";

export function AnimatedHero({
  heading,
  subheading,
  imageUrl,
}: {
  heading?: string;
  subheading?: string;
  imageUrl?: string | null;
} = {}) {
  // When the owner has uploaded a hero photo (Dashboard → Homepage Editor),
  // it becomes a single full-bleed background behind both text blocks,
  // matching the boutique reference look. Without one, this falls back to
  // the original two-panel dark layout so the section never looks broken.
  if (imageUrl) {
    return (
      <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_20px_60px_rgba(17,17,17,0.25)] sm:rounded-[2rem]">
        {/* Background photo — object-cover keeps it filling the section at
            every viewport without distortion, from small phones up. */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Scrim so heading/buttons stay legible over any photo. Stronger
            behind the text column on desktop (left-to-right fade); on
            narrow screens the text stacks over the top of the image, so a
            second top-to-bottom fade keeps that area readable too. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(23,13,6,0.75)_0%,_rgba(23,13,6,0.35)_35%,_rgba(23,13,6,0.15)_60%,_rgba(23,13,6,0.55)_100%)] sm:bg-[linear-gradient(100deg,_rgba(23,13,6,0.85)_0%,_rgba(23,13,6,0.6)_38%,_rgba(23,13,6,0.15)_70%,_transparent_100%)]" />

        <div className="relative z-10 flex min-h-[520px] flex-col justify-between gap-6 p-5 sm:min-h-[600px] sm:gap-8 sm:p-8 lg:min-h-[640px] lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <p className="font-script mb-3 text-lg text-[#B17F5E] sm:mb-4 sm:text-xl">New Festive Collection</p>
            <h1 className="mb-4 text-3xl leading-tight text-white sm:mb-6 sm:text-5xl lg:text-6xl">{heading || "Luxury ethnic fashion for every occasion."}</h1>
            <p className="mb-6 max-w-xl text-sm leading-6 text-gray-200 sm:mb-8 sm:text-base sm:leading-7">{subheading || `Discover handpicked silhouettes, premium fabrics, and concierge-level styling from the home of ${brand.name}.`}</p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href="/collections" className="inline-flex items-center gap-2 rounded-full bg-[#B17F5E] px-5 py-2.5 text-sm font-medium text-[#20130B] transition hover:translate-y-[-2px] sm:px-6 sm:py-3">Shop Now <ArrowRight size={16} /></Link>
              <Link href="/tailoring" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-[#B17F5E] sm:px-6 sm:py-3"><Sparkles size={16} /> Tailoring Services</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xs rounded-[1.2rem] border border-white/10 bg-[#20130B]/85 p-5 backdrop-blur-sm sm:p-6"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#E9CFBA] sm:mb-3 sm:text-xs sm:tracking-[0.35em]">Boutique Edit 2026</p>
            <p className="text-sm leading-6 text-white sm:text-base sm:leading-7">Handpicked heirloom-inspired garments for celebration and everyday elegance.</p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6 rounded-[1.5rem] border border-white/10 bg-[#20130B] p-5 shadow-[0_20px_60px_rgba(17,17,17,0.25)] sm:gap-8 sm:rounded-[2rem] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center"
      >
        <p className="font-script mb-3 text-lg text-[#B17F5E] sm:mb-4 sm:text-xl">New Festive Collection</p>
        <h1 className="mb-4 text-3xl leading-tight text-white sm:mb-6 sm:text-5xl lg:text-6xl">{heading || "Luxury ethnic fashion for every occasion."}</h1>
        <p className="mb-6 max-w-xl text-sm leading-6 text-gray-300 sm:mb-8 sm:text-base sm:leading-7">{subheading || `Discover handpicked silhouettes, premium fabrics, and concierge-level styling from the home of ${brand.name}.`}</p>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Link href="/collections" className="inline-flex items-center gap-2 rounded-full bg-[#B17F5E] px-5 py-2.5 text-sm font-medium text-[#20130B] transition hover:translate-y-[-2px] sm:px-6 sm:py-3">Shop Now <ArrowRight size={16} /></Link>
          <Link href="/tailoring" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#B17F5E] sm:px-6 sm:py-3"><Sparkles size={16} /> Tailoring Services</Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-[200px] overflow-hidden rounded-[1.2rem] bg-[#2A180D] sm:min-h-[300px] sm:rounded-[1.5rem] lg:min-h-[360px]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(177,127,94,0.22),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_#170D06_0%,_#2A180D_55%,_#4A3624_100%)] opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#E9CFBA] sm:mb-3 sm:text-xs sm:tracking-[0.35em]">Boutique Edit 2026</p>
          <h2 className="max-w-sm text-xl text-white sm:text-3xl">Handpicked heirloom-inspired garments for celebration and everyday elegance.</h2>
        </div>
      </motion.div>
    </section>
  );
}
