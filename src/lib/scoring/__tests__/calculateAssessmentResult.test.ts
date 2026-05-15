import { describe, expect, it } from "vitest";

import { calculateAssessmentResult } from "@/lib/scoring";

import { HIGH_RESPONSES, LOW_RESPONSES, MEDIUM_RESPONSES } from "./fixtures";

describe("calculateAssessmentResult orchestrator", () => {
  it("bundles scores, tier, next step, ROI, and insights", () => {
    const result = calculateAssessmentResult(MEDIUM_RESPONSES);
    expect(result.scores).toBeDefined();
    expect(result.tier).toBeDefined();
    expect(result.recommendedNextStep).toBeDefined();
    expect(result.roi).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it("low readiness → foundation tier + foundation_work (compliance gate)", () => {
    const result = calculateAssessmentResult(LOW_RESPONSES);
    expect(result.tier).toBe("foundation");
    expect(result.recommendedNextStep).toBe("foundation_work");
  });

  it("high readiness → scale tier + retainer", () => {
    const result = calculateAssessmentResult(HIGH_RESPONSES);
    expect(result.tier).toBe("scale");
    expect(result.recommendedNextStep).toBe("retainer");
  });

  it("overall latency well under 10ms", () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      calculateAssessmentResult(MEDIUM_RESPONSES);
    }
    const avgMs = (performance.now() - start) / 100;
    expect(avgMs).toBeLessThan(10);
  });

  it("is deterministic — same input, same output", () => {
    const a = calculateAssessmentResult(MEDIUM_RESPONSES);
    const b = calculateAssessmentResult(MEDIUM_RESPONSES);
    expect(a).toEqual(b);
  });
});
