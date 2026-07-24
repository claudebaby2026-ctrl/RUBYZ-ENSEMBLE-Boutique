// Products are treated as "unstitched" if the category or fabric text says
// so — the dashboard has no dedicated flag for this yet, so tagging a
// product's category as e.g. "Unstitched Suits" is enough to trigger the
// tailoring notice, with no backend changes needed.
//
// Deliberately NOT in unstitched-tailoring-notice.tsx: that file is
// "use client", and a Server Component calling a plain function imported
// from a "use client" module fails at runtime (the server only has a
// client-reference stub for it, not the real function). This helper is a
// plain module so both server and client code can call it directly.
export function isUnstitchedProduct(category?: string, fabric?: string): boolean {
  const haystack = `${category ?? ""} ${fabric ?? ""}`.toLowerCase();
  return haystack.includes("unstitch");
}
