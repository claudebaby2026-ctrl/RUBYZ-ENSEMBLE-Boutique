"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Scissors, X } from "lucide-react";

// Same boutique WhatsApp number used in components/tailoring/tailoring-actions.tsx.
const WHATSAPP_NUMBER = "917873011110";

function buildWhatsAppUrl(productName: string) {
  const message = `Hi RUBYZ Ensemble, I'm looking at "${productName}" and would like to know about your custom tailoring service for it.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Pops a dismissible notification on unstitched-cloth product pages
 * advertising the boutique's custom tailoring service, with a one-tap
 * WhatsApp enquiry pre-filled with the product name.
 *
 * Shown once per browser tab session (sessionStorage) per product, so it
 * doesn't nag a shopper who's already dismissed or clicked it, and appears
 * after a short delay so it doesn't block the initial page view.
 */
export function UnstitchedTailoringNotice({ productSlug, productName }: { productSlug: string; productName: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `tailoring-notice-seen:${productSlug}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [productSlug]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(`tailoring-notice-seen:${productSlug}`, "1");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm">
      <div className="rounded-[1.2rem] border border-black/5 bg-white p-4 shadow-[0_20px_60px_rgba(17,17,17,0.15)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9CFBA] text-[#B17F5E]">
            <Scissors size={16} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#3A2213]">This piece comes unstitched</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Want it tailored to your exact measurements? We offer custom fitting and stitching for this fabric.
            </p>
            <a
              href={buildWhatsAppUrl(productName)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#3A2213] px-4 py-2 text-xs font-medium text-white hover:bg-black"
            >
              <MessageCircle size={13} /> Ask about tailoring
            </a>
          </div>
          <button onClick={dismiss} aria-label="Dismiss" className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
