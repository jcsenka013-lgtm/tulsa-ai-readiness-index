/**
 * Absolute site origin for links in emails and Slack (no trailing slash).
 */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "";
  const trimmed = raw.replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  return `https://${trimmed}`;
}
