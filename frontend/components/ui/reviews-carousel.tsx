"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import type { GoogleReview } from "@/lib/google-reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < Math.round(rating) ? "fill-[#D94F70] text-[#D94F70]" : "fill-transparent text-[#D8C6BB]"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-[1.4rem] border border-[#3A2213]/8 bg-[#FFFBF5] p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {review.authorPhoto ? (
          <img src={review.authorPhoto} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9CFBA] text-sm font-semibold text-[#3A2213]">
            {review.author.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#3A2213]">{review.author}</p>
          <Stars rating={review.rating} />
        </div>
      </div>
      <p className={`mt-4 flex-1 text-sm leading-7 text-[#5C4E44] ${expanded ? "" : "line-clamp-5"}`}>
        &ldquo;{review.text}&rdquo;
      </p>
      {review.text.length > 180 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 self-start text-xs font-semibold uppercase tracking-[0.14em] text-[#D94F70] hover:text-[#B13E5B]"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      )}
      {review.relativeTime && <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-[#B17F5E]">{review.relativeTime}</p>}
    </div>
  );
}

export function ReviewsCarousel({
  reviews,
  googleReviewsUrl,
  overallRating,
  totalReviews,
}: {
  reviews: GoogleReview[];
  googleReviewsUrl: string;
  overallRating?: number;
  totalReviews?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Tracks which card is centered as the person swipes, purely from scroll
  // position — no drag-gesture math to fight with native momentum
  // scrolling, so it stays smooth on every phone/browser.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cardWidth = track.clientWidth;
        if (cardWidth === 0) return;
        setActiveIndex(Math.round(track.scrollLeft / cardWidth));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      {typeof overallRating === "number" && (
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-[#3A2213]">
          <Stars rating={overallRating} />
          <span className="font-semibold">{overallRating.toFixed(1)}</span>
          {typeof totalReviews === "number" && (
            <span className="text-[#7A6D65]">· {totalReviews} Google reviews</span>
          )}
        </div>
      )}

      {/* Mobile: native horizontal swipe, one card per screen, snap-locked
          so a left/right swipe always settles on the next/previous review. */}
      <div
        ref={trackRef}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <div key={review.id} className="w-full shrink-0 snap-center">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5 sm:hidden">
          {reviews.map((review, i) => (
            <button
              key={review.id}
              aria-label={`Show review ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-5 bg-[#D94F70]" : "w-1.5 bg-[#3A2213]/15"}`}
            />
          ))}
        </div>
      )}

      {/* Desktop / tablet: static grid, same data. */}
      <div className="hidden gap-6 sm:grid sm:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href={googleReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#3A2213]/12 bg-[#FFFBF5] px-6 py-3 text-sm uppercase tracking-[0.28em] text-[#3A2213] transition hover:border-[#B17F5E] hover:text-[#B17F5E]"
        >
          Read More on Google <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}
