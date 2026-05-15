import type { ProductType } from "@/types/assessment";

type WindowEntry = { count: number; windowStartMs: number };

const store = new Map<string, WindowEntry>();

const WINDOW_MS = 15 * 60 * 1000;

function limitForProduct(product: ProductType): number {
  if (product === "copilot_readiness") {
    const raw = process.env.ASSESSMENT_CREATE_LIMIT_COPILOT;
    if (raw && Number.isFinite(Number(raw))) return Math.max(1, Math.floor(Number(raw)));
    return 10;
  }
  const raw = process.env.ASSESSMENT_CREATE_LIMIT_AI;
  if (raw && Number.isFinite(Number(raw))) return Math.max(1, Math.floor(Number(raw)));
  return 20;
}

function clientKey(ip: string, product: ProductType): string {
  return `${ip}::${product}`;
}

/**
 * Per-IP, per-product fixed window rate limit (best effort on multi-instance
 * deploys — for strict limits, add Upstash/Redis in front).
 */
export function checkAssessmentCreateLimit(
  clientIp: string,
  product: ProductType,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  if (process.env.ASSESSMENT_CREATE_RATE_LIMIT_DISABLED === "true") {
    return { allowed: true };
  }

  const key = clientKey(clientIp || "unknown", product);
  const max = limitForProduct(product);
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.windowStartMs > WINDOW_MS) {
    store.set(key, { count: 1, windowStartMs: now });
    return { allowed: true };
  }

  if (existing.count < max) {
    existing.count += 1;
    return { allowed: true };
  }

  const elapsed = now - existing.windowStartMs;
  const remainingMs = Math.max(0, WINDOW_MS - elapsed);
  return { allowed: false, retryAfterSec: Math.ceil(remainingMs / 1000) };
}

export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
