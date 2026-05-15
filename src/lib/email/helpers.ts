import type { Industry, ReadinessTier, RecommendedNextStep } from "@/types/assessment";
import { INDUSTRY_QUESTION } from "@/lib/questions/firmographics";
import type { Insight } from "@/lib/scoring";

export function firstNameFromFullName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "there";
  const first = fullName.trim().split(/\s+/)[0];
  return first ?? "there";
}

export function tierDisplayName(tier: ReadinessTier): string {
  switch (tier) {
    case "foundation":
      return "Foundation";
    case "exploration":
      return "Exploration";
    case "pilot":
      return "Pilot";
    case "scale":
      return "Scale";
    default:
      return tier;
  }
}

/** Hex accent for score card (email-safe). */
export function tierAccentColor(tier: ReadinessTier): string {
  switch (tier) {
    case "foundation":
      return "#b45309";
    case "exploration":
      return "#1d4ed8";
    case "pilot":
      return "#047857";
    case "scale":
      return "#6d28d9";
    default:
      return "#0f172a";
  }
}

/**
 * One-line framing aligned with the results narrative by tier
 * (mirrors `generateInsights` tier rules at a high level).
 */
export function tierResultsFraming(tier: ReadinessTier): string {
  switch (tier) {
    case "foundation":
      return "Your scores point to groundwork to shore up before AI spend pays off — that is normal for busy operators.";
    case "exploration":
      return "You are past pure experimentation: the next move is a focused audit so pilots do not stall in IT limbo.";
    case "pilot":
      return "You are in a strong window to scope a narrow, time-boxed pilot with measurable outcomes.";
    case "scale":
      return "You are in the top readiness band — most teams here are ready for an ongoing engagement, not a one-off pilot.";
    default:
      return "Here is a concise read on where AI is likely to help first.";
  }
}

export function recommendedNextStepLabel(step: RecommendedNextStep): string {
  switch (step) {
    case "audit":
      return "Start with a readiness audit";
    case "pilot":
      return "Scope a time-boxed pilot";
    case "retainer":
      return "Plan an ongoing AI program";
    case "foundation_work":
      return "Stabilize foundations before broader AI";
    default:
      return step;
  }
}

export function industryLabel(code: string | null | undefined): string {
  if (!code) return "—";
  const opt = INDUSTRY_QUESTION.options.find((o) => o.value === (code as Industry));
  return opt?.label ?? code;
}

/** First sentence or short excerpt for email blurbs (not full insight body). */
export function insightOneLiner(description: string, maxLen = 180): string {
  const trimmed = description.trim();
  const dot = trimmed.indexOf(".");
  const first =
    dot > 0 && dot < maxLen ? trimmed.slice(0, dot + 1) : trimmed.slice(0, maxLen);
  return first.endsWith(".") ? first : `${first.trim()}…`;
}

export function topTwoInsightBlurbs(insights: Insight[]): { title: string; line: string }[] {
  return insights.slice(0, 2).map((i) => ({
    title: i.title,
    line: insightOneLiner(i.description),
  }));
}

export function firstInsightTitle(insights: Insight[]): string {
  return insights[0]?.title ?? "your results";
}

/**
 * Prefer a concrete process label from free-tier multi-select when present.
 */
export function topOpportunityFromResponses(
  responses: Record<string, unknown>,
): string | null {
  const raw = responses["op_time_consuming_processes"];
  const arr = Array.isArray(raw) ? raw.map(String) : raw != null ? [String(raw)] : [];
  const filtered = arr.filter((l) => l && l !== "None of the above");
  return filtered[0] ?? null;
}

export function firstOpportunityInsightTitle(insights: Insight[]): string | null {
  const hit = insights.find((i) => i.severity === "opportunity");
  return hit?.title ?? null;
}
