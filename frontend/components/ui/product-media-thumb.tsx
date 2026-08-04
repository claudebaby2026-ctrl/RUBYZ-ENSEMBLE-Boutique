import type { ReactNode } from "react";
import { resolveImageUrl } from "@/lib/api";

/**
 * Renders a product's primary preview media: its first image, or — when
 * there's no image but there is a video — a static-looking preview frame
 * from that video (no controls, not autoplaying; `preload="metadata"`
 * makes the browser show frame 1 without playing). Falls back to
 * `placeholder` only when neither exists.
 *
 * Centralizes the images[0]-then-videos[0]-then-placeholder fallback so
 * every card/thumbnail/gallery entry point (product-card,
 * animated-product-card, search results, admin thumbnails, ...) behaves
 * the same way.
 */
export function ProductMediaThumb({
  images,
  videos,
  alt,
  className,
  placeholder,
}: {
  images?: string[] | null;
  videos?: string[] | null;
  alt: string;
  className: string;
  placeholder: ReactNode;
}) {
  const image = resolveImageUrl(images?.[0]);
  const video = !image ? resolveImageUrl(videos?.[0]) : undefined;

  if (image) {
    return <img src={image} alt={alt} className={className} />;
  }

  if (video) {
    return (
      <video
        src={video}
        aria-label={alt}
        className={className}
        preload="metadata"
        muted
        playsInline
      />
    );
  }

  return <>{placeholder}</>;
}
