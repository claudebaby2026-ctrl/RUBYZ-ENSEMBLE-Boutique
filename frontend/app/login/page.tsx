"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, Phone, User as UserIcon } from "lucide-react";
import { login, register } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "login"
          ? await login(form.email, form.password)
          : await register({
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
            });

      // Owners land in the dashboard; customers go wherever they came from
      // (or the homepage), never into the admin dashboard.
      if (result.user.role === "owner") {
        router.push("/dashboard");
      } else {
        router.push(redirectTo === "/dashboard" ? "/" : redirectTo);
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#B68D40]">RUBYZ Ensemble</p>
        <h1 className="mt-2 text-3xl text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {mode === "login"
            ? "Sign in to your account or the owner dashboard."
            : "Sign up to track orders and check out faster."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[1.6rem] border border-black/5 bg-white p-6 shadow-sm">
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Full Name</label>
            <div className="mt-1 flex items-center gap-2 rounded-[1rem] border border-black/10 px-3 py-3">
              <UserIcon size={16} className="text-gray-400" />
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-sm outline-none"
                placeholder="Jane Doe"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Email</label>
          <div className="mt-1 flex items-center gap-2 rounded-[1rem] border border-black/10 px-3 py-3">
            <Mail size={16} className="text-gray-400" />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-sm outline-none"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Phone (optional)</label>
            <div className="mt-1 flex items-center gap-2 rounded-[1rem] border border-black/10 px-3 py-3">
              <Phone size={16} className="text-gray-400" />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full text-sm outline-none"
                placeholder="78730 11110"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Password</label>
          <div className="mt-1 flex items-center gap-2 rounded-[1rem] border border-black/10 px-3 py-3">
            <Lock size={16} className="text-gray-400" />
            <input
              required
              type="password"
              minLength={mode === "signup" ? 8 : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full text-sm outline-none"
              placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#D94F70]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm text-white disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {mode === "login" ? "New to RUBYZ Ensemble?" : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setError(null);
            setMode(mode === "login" ? "signup" : "login");
          }}
          className="text-[#B68D40] underline"
        >
          {mode === "login" ? "Create an account" : "Sign in instead"}
        </button>
      </p>

      {mode === "login" && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Boutique owner? Sign in above with your owner email — you'll be taken straight to the dashboard.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
