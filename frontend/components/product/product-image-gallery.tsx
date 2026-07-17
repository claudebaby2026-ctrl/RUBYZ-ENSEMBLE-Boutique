"use client";

import { useState } from "react";

export function ProductImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const mainImage = images[selected] ?? images[0];

  return (
    <div>
      {mainImage ? (
        <img src={mainImage} alt={alt} className="h-[440px] w-full rounded-[1.4rem] object-cover" />
      ) : (
        <div className="h-[440px] rounded-[1.4rem] bg-[linear-gradient(135deg,_#F8F5F1_0%,_#E4D4BE_100%)]" />
      )}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
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
              <img src={src} alt={`${alt} ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
