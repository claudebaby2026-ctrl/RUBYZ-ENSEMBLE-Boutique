"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ApiError, joinWhatsAppCommunity } from "@/lib/api";

export function WhatsAppCommunityForm() {
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsappNumber.trim()) return;
    setStatus("loading");
    setError("");
    try {
      await joinWhatsAppCommunity(name.trim(), whatsappNumber.trim());
      setStatus("done");
      setName("");
      setWhatsappNumber("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#B68D40]">
        <Check size={16} />
        <span>You&apos;re in! We&apos;ll save your number and reach out on WhatsApp.</span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#B68D40]"
        />
        <input
          type="tel"
          required
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="Your WhatsApp number"
          className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#B68D40]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-[#B68D40] px-6 py-3 text-sm font-medium text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join Now"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-center text-xs text-[#D94F70]">{error}</p>}
    </div>
  );
}
