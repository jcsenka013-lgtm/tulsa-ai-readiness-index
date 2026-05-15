import { describe, expect, it } from "vitest";

import {
  calculateDimensionScores,
  calculateOverallScore,
} from "@/lib/scoring/calculateScores";
import { generateInsights } from "@/lib/scoring/generateInsights";
import type { ScoreBreakdown } from "@/types/assessment";

import { HIGH_RESPONSES, LOW_RESPONSES, MEDIUM_RESPONSES } from "./fixtures";

function fullBreakdown(responses: Parameters<typeof calculateDimensionScores>[0]): ScoreBreakdown {
  const domain = calculateDimensionScores(responses);
  return { ...domain, overall: calculateOverallScore(domain) };
}

describe("generateInsights — low readiness respondent (handles regulated data)", () => {
  const scores = fullBreakdown(LOW_RESPONSES);
  const insights = generateInsights(scores, LOW_RESPONSES);

  it("returns 5-8 insights", () => {
    expect(insights.length).toBeGreaterThanOrEqual(5);
    expect(insights.length).toBeLessThanOrEqual(8);
  });

  it("fires the compliance-gap critical", () => {
    const ids = insights.map((i) => i.id);
    expect(ids).toContain("compliance-gap");
    const critical = insights.find((i) => i.id === "compliance-gap");
    expect(critical?.severity).toBe("critical");
  });

  it("fires the shadow-ai-risk critical (regulated data + unmonitored AI)", () => {
    const ids = insights.map((i) => i.id);
    expect(ids).toContain("shadow-ai-risk");
  });

  it("includes at least one strength insight even for low scorers", () => {
    expect(insights.some((i) => i.severity === "strength")).toBe(true);
  });

  it("references the respondent's specific answers in copy", () => {
    const compliance = insights.find((i) => i.id === "compliance-gap");
    expect(compliance?.description).toContain("HIPAA");
  });
});

describe("generateInsights — medium readiness", () => {
  const scores = fullBreakdown(MEDIUM_RESPONSES);
  const insights = generateInsights(scores, MEDIUM_RESPONSES);

  it("does NOT fire the compliance-gap (security score is respectable)", () => {
    const ids = insights.map((i) => i.id);
    expect(ids).not.toContain("compliance-gap");
  });

  it("may surface the high-document-volume opportunity (100-500/week bucket)", () => {
    const ids = insights.map((i) => i.id);
    expect(ids).toContain("high-volume-opportunity");
  });

  it("still includes a strength insight", () => {
    expect(insights.some((i) => i.severity === "strength")).toBe(true);
  });
});

describe("generateInsights — high readiness / scale tier", () => {
  const scores = fullBreakdown(HIGH_RESPONSES);
  const insights = generateInsights(scores, HIGH_RESPONSES);

  it("has no critical insights", () => {
    expect(insights.every((i) => i.severity !== "critical")).toBe(true);
  });

  it("includes the scale-ready opportunity", () => {
    expect(insights.map((i) => i.id)).toContain("scale-ready");
  });

  it("leads with strengths for a high scorer", () => {
    const severities = insights.map((i) => i.severity);
    expect(severities.filter((s) => s === "strength").length).toBeGreaterThanOrEqual(2);
  });
});

describe("generateInsights — edge cases", () => {
  it("still returns a strength insight for a completely empty response set", () => {
    const empty = fullBreakdown({});
    const insights = generateInsights(empty, {});
    expect(insights.some((i) => i.severity === "strength")).toBe(true);
    expect(insights.length).toBeGreaterThanOrEqual(1);
  });

  it("does not duplicate insights on the same domain+severity", () => {
    const insights = generateInsights(fullBreakdown(LOW_RESPONSES), LOW_RESPONSES);
    const seen = new Set<string>();
    for (const i of insights) {
      if (i.severity === "critical" || i.severity === "warning") {
        const key = `${i.dimension}:${i.severity}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("fires the blocked-leadership critical when leadership has banned AI", () => {
    const scores = fullBreakdown(MEDIUM_RESPONSES);
    const banned = {
      ...MEDIUM_RESPONSES,
      team_leadership_stance: "Blocked — leadership has banned AI tools",
    };
    const insights = generateInsights(scores, banned);
    expect(insights.map((i) => i.id)).toContain("blocked-leadership");
  });
});
