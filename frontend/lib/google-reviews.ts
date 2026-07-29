import { googlePlaceId, reviews as staticReviews } from "@/lib/content";

export type GoogleReview = {
  id: string;
  author: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
};

export type GoogleReviewsResult = {
  reviews: GoogleReview[];
  // "google" = live data from the Places API. "fallback" = the static
  // reviews in lib/content.ts, used whenever GOOGLE_PLACES_API_KEY isn't
  // configured yet or the API call fails, so the section is never empty.
  source: "google" | "fallback";
  overallRating?: number;
  totalReviews?: number;
};

const FALLBACK_RESULT: GoogleReviewsResult = {
  source: "fallback",
  reviews: staticReviews.map((r, i) => ({
    id: `static-${i}`,
    author: r.name,
    rating: r.rating,
    text: r.text,
    relativeTime: "",
  })),
};

// Cache the live lookup for 6 hours (Places API "New" is billed per call,
// and reviews don't change minute to minute) — Next.js's fetch cache keys
// this by URL, so every request within the window reuses the same result
// instead of hitting Google on every page load.
const REVALIDATE_SECONDS = 60 * 60 * 6;

// Pulls up to 5 real reviews from RUBYZ-ENSEMBLE Boutique's Google Business
// Profile (see googlePlaceId in lib/content.ts) using the Places API (New)
// Place Details endpoint. Requires a GOOGLE_PLACES_API_KEY env var with the
// "Places API (New)" enabled in Google Cloud Console — see README for setup.
// Falls back to the static reviews array so the homepage section is never
// empty, e.g. before that key is configured or if the call fails.
export async function getGoogleReviews(): Promise<GoogleReviewsResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return FALLBACK_RESULT;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${googlePlaceId}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews,rating,userRatingCount",
        },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    );

    if (!res.ok) return FALLBACK_RESULT;

    const data = await res.json();
    const rawReviews: any[] = Array.isArray(data.reviews) ? data.reviews : [];
    if (rawReviews.length === 0) return FALLBACK_RESULT;

    const reviews: GoogleReview[] = rawReviews.map((r, i) => ({
      id: r.name || `google-${i}`,
      author: r.authorAttribution?.displayName || "Google User",
      authorPhoto: r.authorAttribution?.photoUri || undefined,
      rating: typeof r.rating === "number" ? r.rating : 5,
      text: (r.text?.text || r.originalText?.text || "").trim(),
      relativeTime: r.relativePublishTimeDescription || "",
    })).filter((r) => r.text.length > 0);

    if (reviews.length === 0) return FALLBACK_RESULT;

    return {
      source: "google",
      reviews,
      overallRating: typeof data.rating === "number" ? data.rating : undefined,
      totalReviews: typeof data.userRatingCount === "number" ? data.userRatingCount : undefined,
    };
  } catch {
    return FALLBACK_RESULT;
  }
}
