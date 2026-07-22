"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ApiError, subscribeToNewsletter } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError("");
    try {
      await subscribeToNewsletter(email.trim());
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#B68D40]">
        <Check size={16} />
        <span>You&apos;re on the list — thanks for joining!</span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="flex-1 rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#B68D40]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-[#B68D40] px-6 py-3 text-sm font-medium text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Subscribe"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 text-center text-xs text-[#D94F70]">{error}</p>}
    </div>
  );
}
