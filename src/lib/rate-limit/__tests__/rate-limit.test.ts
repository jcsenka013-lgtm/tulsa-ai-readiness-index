import { afterEach, describe, expect, it } from "vitest";

import { checkAssessmentCreateLimit, getClientIpFromRequest } from "../assessment-create";
import { checkAssistantLimit } from "../assistant";
import { registerRateLimiters, type RateLimitBinding } from "../workers-limiter";

function fakeLimiter(allowedKeys: Set<string> | "none"): RateLimitBinding & { keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    async limit({ key }) {
      keys.push(key);
      return { success: allowedKeys !== "none" && allowedKeys.has(key) };
    },
  };
}

afterEach(() => registerRateLimiters({}));

describe("getClientIpFromRequest", () => {
  it("prefers CF-Connecting-IP over a client-supplied X-Forwarded-For", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.1.1.1, 203.0.113.9", "cf-connecting-ip": "203.0.113.9" },
    });
    expect(getClientIpFromRequest(req)).toBe("203.0.113.9");
  });

  it("falls back to X-Forwarded-For off Cloudflare", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "198.51.100.4" } });
    expect(getClientIpFromRequest(req)).toBe("198.51.100.4");
  });
});

describe("Workers rate limit bindings", () => {
  it("blocks assessment creation when the binding rejects", async () => {
    const limiter = fakeLimiter("none");
    registerRateLimiters({ ASSESSMENT_CREATE_LIMITER: limiter });
    const result = await checkAssessmentCreateLimit("203.0.113.50", "copilot_readiness");
    expect(result).toEqual({ allowed: false, retryAfterSec: 60 });
    expect(limiter.keys).toEqual(["203.0.113.50::copilot_readiness"]);
  });

  it("checks the assistant per IP and per assessment", async () => {
    const limiter = fakeLimiter(new Set(["ip::203.0.113.51"]));
    registerRateLimiters({ ASSISTANT_LIMITER: limiter });
    const result = await checkAssistantLimit("203.0.113.51", "abc");
    expect(result.allowed).toBe(false);
    expect(limiter.keys).toEqual(["ip::203.0.113.51", "assessment::abc"]);
  });

  it("allows the request when the binding throws", async () => {
    registerRateLimiters({
      ASSISTANT_LIMITER: {
        limit: async () => {
          throw new Error("binding down");
        },
      },
    });
    expect(await checkAssistantLimit("203.0.113.52", "def")).toEqual({ allowed: true });
  });
});
