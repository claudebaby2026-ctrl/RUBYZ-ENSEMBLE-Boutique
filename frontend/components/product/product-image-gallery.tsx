"use client";

import { useState } from "react";
import { X } from "lucide-react";

// Position-specific descriptors so each image in the gallery gets distinct,
// meaningful alt text (SEO plan §3) instead of "{name} 1", "{name} 2", etc.
// on every thumbnail.
const POSITION_LABELS = ["front view", "back view", "close-up of embroidery", "styled detail"];

function altFor(alt: string, fabric: string | undefined, index: number): string {
  const base = fabric ? `${alt} — ${fabric}` : alt;
  const position = POSITION_LABELS[index];
  return position ? `${base}, ${position}` : base;
}

export function ProductImageGallery({
  images,
  videos = [],
  alt,
  fabric,
}: {
  images: string[];
  videos?: string[];
  alt: string;
  fabric?: string;
}) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Media is images first, then videos — indices carry straight through to
  // both the main viewer and the thumbnail strip.
  const media = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...videos.map((src) => ({ type: "video" as const, src })),
  ];
  const mainItem = media[selected] ?? media[0];

  return (
    <div>
      {mainItem ? (
        mainItem.type === "video" ? (
          <video
            src={mainItem.src}
            controls
            onClick={() => setLightboxOpen(true)}
            className="max-h-[520px] w-full cursor-zoom-in rounded-[1.1rem] bg-[#F4ECE1] object-contain sm:max-h-[640px] sm:rounded-[1.4rem] lg:max-h-[720px]"
          />
        ) : (
          <img
            src={mainItem.src}
            alt={altFor(alt, fabric, selected)}
            onClick={() => setLightboxOpen(true)}
            className="max-h-[520px] w-full cursor-zoom-in rounded-[1.1rem] bg-[#F4ECE1] object-contain sm:max-h-[640px] sm:rounded-[1.4rem] lg:max-h-[720px]"
          />
        )
      ) : (
        <div className="h-[320px] rounded-[1.1rem] bg-[linear-gradient(135deg,_#E9CFBA_0%,_#D8BFA8_100%)] sm:h-[400px] sm:rounded-[1.4rem] lg:h-[440px]" />
      )}
      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-4 sm:gap-3">
          {media.slice(0, 4).map((item, index) => (
            <button
              key={item.src + index}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show ${alt} ${item.type} ${index + 1}`}
              aria-current={selected === index}
              className={`relative aspect-square overflow-hidden rounded-[1rem] border transition ${
                selected === index ? "border-[#B17F5E] ring-2 ring-[#B17F5E]/40" : "border-[#3A2213]/8 hover:border-[#B17F5E]/60"
              }`}
            >
              {item.type === "video" ? (
                <video src={item.src} className="h-full w-full object-cover" muted />
              ) : (
                <img src={item.src} alt={altFor(alt, fabric, index)} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox: shows the media at its true aspect ratio (object-contain
          inside a viewport-sized box) instead of the cropped preview above. */}
      {lightboxOpen && mainItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          {mainItem.type === "video" ? (
            <video
              src={mainItem.src}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-[0.6rem] object-contain"
            />
          ) : (
            <img
              src={mainItem.src}
              alt={altFor(alt, fabric, selected)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-[0.6rem] object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
