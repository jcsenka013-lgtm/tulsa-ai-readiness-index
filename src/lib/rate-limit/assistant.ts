type WindowEntry = { count: number; windowStartMs: number };

const store = new Map<string, WindowEntry>();

const WINDOW_MS = 60 * 60 * 1000;
const PER_IP = 40;
const PER_ASSESSMENT = 30;

function hit(key: string, max: number, now: number): number | null {
  const existing = store.get(key);
  if (!existing || now - existing.windowStartMs > WINDOW_MS) {
    store.set(key, { count: 1, windowStartMs: now });
    return null;
  }
  if (existing.count < max) {
    existing.count += 1;
    return null;
  }
  return Math.ceil((WINDOW_MS - (now - existing.windowStartMs)) / 1000);
}

/**
 * Hourly caps on results-assistant messages, per IP and per assessment, to
 * bound model spend on a shareable results link. Best effort per instance,
 * like the assessment-create limiter.
 */
export function checkAssistantLimit(
  clientIp: string,
  assessmentId: string,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  if (process.env.ASSISTANT_RATE_LIMIT_DISABLED === "true") {
    return { allowed: true };
  }
  const now = Date.now();
  const retry =
    hit(`ip::${clientIp || "unknown"}`, PER_IP, now) ??
    hit(`assessment::${assessmentId}`, PER_ASSESSMENT, now);
  return retry === null ? { allowed: true } : { allowed: false, retryAfterSec: retry };
}
