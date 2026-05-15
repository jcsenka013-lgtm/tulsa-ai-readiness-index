/**
 * Lightweight analytics hook — extend with Segment, GA4, etc.
 */

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === "undefined") return;
  const payload = { name, properties: properties ?? {}, ts: Date.now() };
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", payload);
  }
  window.dispatchEvent(new CustomEvent("tai:analytics", { detail: payload }));
}
