"use client";

import { useState } from "react";

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
  alt,
  fabric,
}: {
  images: string[];
  alt: string;
  fabric?: string;
}) {
  const [selected, setSelected] = useState(0);
  const mainImage = images[selected] ?? images[0];

  return (
    <div>
      {mainImage ? (
        <img
          src={mainImage}
          alt={altFor(alt, fabric, selected)}
          className="h-[320px] w-full rounded-[1.1rem] object-cover sm:h-[400px] sm:rounded-[1.4rem] lg:h-[440px]"
        />
      ) : (
        <div className="h-[320px] rounded-[1.1rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)] sm:h-[400px] sm:rounded-[1.4rem] lg:h-[440px]" />
      )}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-4 sm:gap-3">
          {images.slice(0, 4).map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show ${alt} photo ${index + 1}`}
              aria-current={selected === index}
              className={`aspect-square overflow-hidden rounded-[1rem] border transition ${
                selected === index ? "border-[#B68D40] ring-2 ring-[#B68D40]/40" : "border-black/5 hover:border-[#B68D40]/60"
              }`}
            >
              <img src={src} alt={altFor(alt, fabric, index)} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
