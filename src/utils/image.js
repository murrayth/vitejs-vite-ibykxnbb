/**
 * image.js
 * Purpose: Centralise image field picking and fallbacks.
 *  - Prefer `image_url` (your feed).
 *  - Force https:// to avoid mixed-content.
 *  - Provide a base64 SVG placeholder for broken/missing images.
 */

// A tiny inline SVG placeholder for missing images
export const PLACEHOLDER_SVG =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="#f3f4f6"/><g fill="#9ca3af"><rect x="20" y="44" width="120" height="40" rx="6"/><circle cx="50" cy="64" r="10"/><rect x="80" y="56" width="44" height="16" rx="3"/></g></svg>'
  );

// Choose a usable image URL from a projector record
export function pickImageUrl(p) {
  let url =
    p.image_url || // your JSON field
    p.image_link ||
    p.image ||
    (Array.isArray(p.additional_image_link)
      ? p.additional_image_link[0]
      : p.additional_image_link) ||
    p.small_image ||
    p.large_image ||
    "";

  if (!url) return "";

  url = String(url).trim();

  // Avoid mixed-content issues in preview environments
  if (url.startsWith("http://")) {
    url = "https://" + url.slice("http://".length);
  }

  // Sanitise spaces
  url = url.replace(/ /g, "%20");

  return url;
}

// Lightweight URL sanity check
export function seemsUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}
