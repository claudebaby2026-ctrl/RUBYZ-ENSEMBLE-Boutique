import type { Metadata } from "next";

// Belt-and-suspenders alongside app/robots.ts's disallow rule for this
// route (SEO plan §5): robots.txt only stops crawling, not indexing of a
// URL that's linked to from elsewhere, so this page-level noindex is the
// part that actually keeps it out of search results. This page's own
// component is a client component ("use client"), which can't export
// `metadata` itself — a thin server layout is the standard way to attach
// metadata to it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
