"use client";

import { useState } from "react";
import { Loader2, MessageCircle, X } from "lucide-react";

// RUBYZ Ensemble's boutique WhatsApp/contact number (Satyanagar, Bhubaneswar).
const WHATSAPP_NUMBER = "917873011110";

const SERVICES = ["Custom Fitting", "Alterations", "Styling Consultation", "Bridal Tailoring"];

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function AppointmentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", service: SERVICES[0], notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = form.name.trim().length > 0 && form.phone.trim().length > 0 && form.date.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const message =
      `Hi RUBYZ Ensemble, I'd like to book a tailoring appointment.\n\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Service: ${form.service}\n` +
      `Preferred date: ${form.date}${form.time ? ` at ${form.time}` : ""}\n` +
      (form.notes.trim() ? `Notes: ${form.notes.trim()}` : "");
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-md rounded-[1.4rem] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-[#111111]" style={{ fontFamily: "Playfair Display, serif" }}>Book an Appointment</h3>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="mt-1 text-sm text-gray-500">We&apos;ll confirm your slot over WhatsApp within business hours (11am – 8pm).</p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Service</label>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm">
                {SERVICES.map((service) => <option key={service}>{service}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Preferred Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Preferred Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.24em] text-gray-500">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-black/10 px-5 py-2.5 text-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Continue on WhatsApp
          </button>
        </div>
        {!canSubmit && <p className="mt-2 text-xs text-gray-400">Name, phone and preferred date are required.</p>}
      </div>
    </div>
  );
}

export function TailoringActions() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-full bg-[#111111] px-6 py-3 text-sm font-medium text-white hover:bg-black"
        >
          Book an Appointment
        </button>
        <a
          href={buildWhatsAppUrl("Hi RUBYZ Ensemble, I'd like to know more about your tailoring services.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-medium text-[#111111] hover:border-[#B68D40] hover:text-[#B68D40]"
        >
          <MessageCircle size={16} /> WhatsApp Us
        </a>
      </div>
      {showModal && <AppointmentModal onClose={() => setShowModal(false)} />}
    </>
  );
}