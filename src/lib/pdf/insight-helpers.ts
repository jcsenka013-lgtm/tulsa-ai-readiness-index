import type { Insight, InsightSeverity } from "@/lib/scoring/generateInsights";

const EXEC_SUMMARY_ORDER: InsightSeverity[] = [
  "critical",
  "warning",
  "opportunity",
  "strength",
];

const ORDER_INDEX: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  strength: 3,
};

/** Top 3 for executive summary: critical first, then warning, then opportunity. */
export function topInsightsForExecutiveSummary(insights: Insight[]): Insight[] {
  const pool = insights.filter((i) => i.severity !== "strength");
  const sorted = [...pool].sort(
    (a, b) => ORDER_INDEX[a.severity] - ORDER_INDEX[b.severity],
  );
  return sorted.slice(0, 3);
}

/** Full-report ordering: severity bands, stable within band. */
export function sortInsightsForFullReport(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => ORDER_INDEX[a.severity] - ORDER_INDEX[b.severity],
  );
}

export function splitInsightsAcrossTwoPages(
  insights: Insight[],
): [Insight[], Insight[]] {
  const sorted = sortInsightsForFullReport(insights);
  if (sorted.length === 0) return [[], []];
  const mid = Math.ceil(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}
