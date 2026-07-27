// Display-only formatting helpers. These never touch what's stored in the
// database — the owner can still type a product name however they like in
// the dashboard; this just normalizes how it's *shown* on the storefront.

/**
 * Capitalizes the first letter of every word, lowercasing the rest.
 * "silk saree set" -> "Silk Saree Set"
 * "SILK   saree" -> "Silk   Saree" (preserves existing whitespace/hyphens)
 *
 * Splits on whitespace boundaries only, so hyphenated words like
 * "off-shoulder" become "Off-shoulder" (matches how title case is usually
 * done for names/product titles — feel free to swap in a hyphen-aware
 * version later if you want "Off-Shoulder" instead).
 */
export function toTitleCase(value: string): string {
  if (!value) return value;
  return value.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
