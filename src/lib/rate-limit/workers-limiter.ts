/**
 * Hand-off for Cloudflare Workers Rate Limiting bindings (`ratelimits` in
 * wrangler.jsonc). worker/index.ts registers them per request because route
 * handlers can't see `env`; kept dependency-free like workers-ai.ts.
 *
 * Unlike the in-memory limiters, these counters are shared across isolates
 * in a Cloudflare location, so they survive cold starts and isolate churn.
 */

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type LimiterName = "ASSESSMENT_CREATE_LIMITER" | "ASSISTANT_LIMITER";

const BINDINGS_KEY = "__taaRateLimiters";

export function registerRateLimiters(
  bindings: Partial<Record<LimiterName, RateLimitBinding | undefined>>,
): void {
  (globalThis as Record<string, unknown>)[BINDINGS_KEY] = bindings;
}

function getLimiter(name: LimiterName): RateLimitBinding | undefined {
  const bindings = (globalThis as Record<string, unknown>)[BINDINGS_KEY] as
    | Partial<Record<LimiterName, RateLimitBinding>>
    | undefined;
  return bindings?.[name];
}

/**
 * True when the request is allowed. With no binding (next dev, tests) or if
 * the binding errors, it allows the request and leaves enforcement to the
 * in-memory limiter.
 */
export async function workersLimitAllows(name: LimiterName, key: string): Promise<boolean> {
  const limiter = getLimiter(name);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch (err) {
    console.error(`${name} failed:`, err);
    return true;
  }
}
