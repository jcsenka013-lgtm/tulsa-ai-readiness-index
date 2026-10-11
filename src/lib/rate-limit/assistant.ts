import { workersLimitAllows } from "./workers-limiter";

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
 * Caps on results-assistant messages, per IP and per assessment, to bound
 * model spend on a shareable results link: a per-minute Workers Rate Limiting
 * binding (shared across isolates in a location) plus hourly in-memory caps
 * (per isolate, best effort).
 */
export async function checkAssistantLimit(
  clientIp: string,
  assessmentId: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  if (process.env.ASSISTANT_RATE_LIMIT_DISABLED === "true") {
    return { allowed: true };
  }
  const ipKey = `ip::${clientIp || "unknown"}`;
  const assessmentKey = `assessment::${assessmentId}`;
  if (
    !(await workersLimitAllows("ASSISTANT_LIMITER", ipKey)) ||
    !(await workersLimitAllows("ASSISTANT_LIMITER", assessmentKey))
  ) {
    return { allowed: false, retryAfterSec: 60 };
  }
  const now = Date.now();
  const retry =
    hit(ipKey, PER_IP, now) ?? hit(assessmentKey, PER_ASSESSMENT, now);
  return retry === null ? { allowed: true } : { allowed: false, retryAfterSec: retry };
}
