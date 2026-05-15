import { describe, expect, it } from "vitest";

import { resolveProductFromPath } from "../resolveProduct";

describe("resolveProductFromPath", () => {
  it("maps /copilot and nested routes to copilot_readiness", () => {
    expect(resolveProductFromPath("/copilot")).toBe("copilot_readiness");
    expect(resolveProductFromPath("/copilot/assessment")).toBe("copilot_readiness");
    expect(resolveProductFromPath("/copilot/results/x")).toBe("copilot_readiness");
  });

  it("maps main product routes to ai_readiness", () => {
    expect(resolveProductFromPath("/")).toBe("ai_readiness");
    expect(resolveProductFromPath("/assessment")).toBe("ai_readiness");
    expect(resolveProductFromPath("/results/abc")).toBe("ai_readiness");
  });
});
