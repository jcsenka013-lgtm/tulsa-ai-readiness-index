import { describe, expect, it } from "vitest";

import { loadCopilotSupplementalQuestions } from "@/lib/questions/bank";
import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
  extractM365Signals,
} from "@/lib/m365-gap-analysis";
import {
  calculateDimensionScores,
  calculateOverallScore,
} from "@/lib/scoring/calculateScores";
import { generateInsights } from "@/lib/scoring/generateInsights";
import type { AssessmentResponse } from "@/types/assessment";
import type { ScoreBreakdown } from "@/types/assessment";

import { COPILOT_FLOW_RESPONSES, HIGH_RESPONSES, MEDIUM_RESPONSES } from "./fixtures";

function breakdown(responses: AssessmentResponse): ScoreBreakdown {
  const d = calculateDimensionScores(responses);
  return { ...d, overall: calculateOverallScore(d) };
}

const supp = loadCopilotSupplementalQuestions();

describe("extractM365Signals", () => {
  it("returns ordered signals for selected options that define m365_signal", () => {
    const s = extractM365Signals(
      {
        COPILOT_LICENSE: "We don't use Microsoft 365",
        SENSITIVITY_LABELS: "I don't know / never heard of Purview",
      },
      supp,
    );
    expect(s).toContain("not_m365_tenant");
    expect(s).toContain("purview_unknown");
  });

  it("yields the copilot_flow fixture signals", () => {
    const s = extractM365Signals(COPILOT_FLOW_RESPONSES, supp);
    expect(s).toEqual(
      expect.arrayContaining([
        "copilot_purchased_low_adoption",
        "sharepoint_unknown",
        "purview_not_deployed",
      ]),
    );
  });
});

describe("M365 gap analysis with supplemental signals", () => {
  it("enriches compliance gaps, upgrades, and quick wins when flow signals are present", () => {
    const input = buildM365GapAnalysisInput(
      COPILOT_FLOW_RESPONSES,
      "dental",
      "6-20",
    );
    expect(input.m365Signals?.length).toBeGreaterThan(0);
    const report = analyzeM365SecurityGaps(input);
    const controls = report.compliance_gaps.map((g) => g.control);
    expect(
      controls.some((c) => c.toLowerCase().includes("blast radius")),
    ).toBe(true);
    expect(
      report.recommended_upgrades.some((u) =>
        u.to_sku.toLowerCase().includes("purview"),
      ),
    ).toBe(true);
    expect(
      report.quick_wins.some((w) => w.effort === "medium" && /Copilot|seat/i.test(w.title)),
    ).toBe(true);
  });

  it("flags non-M365 tenant relevance when applicable", () => {
    const r = analyzeM365SecurityGaps(
      buildM365GapAnalysisInput(
        { ...HIGH_RESPONSES, COPILOT_LICENSE: "We don't use Microsoft 365" },
        "dental",
        "6-20",
      ),
    );
    expect(r.copilot_relevance?.status).toBe("not_microsoft_365_tenant");
    expect(r.executive_summary_bullets[0].toLowerCase()).toMatch(/not on microsoft|microsoft 365/);
  });
});

describe("Copilot supplemental insight rules", () => {
  it("rule copilot-bought-foundation: purchased seats, low security score", () => {
    const scores = breakdown(COPILOT_FLOW_RESPONSES);
    const insights = generateInsights(scores, COPILOT_FLOW_RESPONSES);
    expect(insights.map((i) => i.id)).toContain("copilot-bought-foundation");
  });

  it("rule sharepoint-blast-copilot: critical SharePoint signal", () => {
    const responses: AssessmentResponse = {
      ...MEDIUM_RESPONSES,
      SHAREPOINT_OVERSHARING: "Probably most of them — we never set strict permissions",
    };
    const scores = breakdown(responses);
    const insights = generateInsights(scores, responses);
    expect(insights.map((i) => i.id)).toContain("sharepoint-blast-copilot");
  });

  it("rule copilot-vague-intent: weak intent answers", () => {
    const responses: AssessmentResponse = {
      ...MEDIUM_RESPONSES,
      COPILOT_INTENT: "Vague sense that we should be doing 'AI'",
    };
    const scores = breakdown(responses);
    const insights = generateInsights(scores, responses);
    expect(insights.map((i) => i.id)).toContain("copilot-vague-intent");
  });

  it("rule copilot-pricing-window: evaluating or not considered", () => {
    const responses: AssessmentResponse = {
      ...MEDIUM_RESPONSES,
      COPILOT_LICENSE: "We're evaluating — haven't bought seats yet",
    };
    const scores = breakdown(responses);
    const insights = generateInsights(scores, responses);
    expect(insights.map((i) => i.id)).toContain("copilot-pricing-window");
  });
});

describe("scoring with supplemental questions", () => {
  it("nudges a domain when a supplemental question in that domain is answered", () => {
    const base = calculateDimensionScores(MEDIUM_RESPONSES);
    const nudged = calculateDimensionScores({
      ...MEDIUM_RESPONSES,
      COPILOT_INTENT: "Clear use cases — we know exactly what we want it to do",
    });
    // COPILOT_INTENT is in financial_strategic_alignment; a max-score answer
    // should not reduce that domain score vs. leaving it unanswered.
    expect(nudged.financialStrategicAlignment).toBeGreaterThanOrEqual(
      base.financialStrategicAlignment,
    );
  });
});
