import type { AssessmentResponse } from "@/types/assessment";

const NONE = "None of the above";

/**
 * Pull up to three human-readable automation targets from the assessment
 * responses (multi-select on repetitive processes).
 */
export function topAutomationOpportunities(
  responses: AssessmentResponse,
  max = 3,
): string[] {
  const raw = responses.op_time_consuming_processes;
  const labels: string[] = Array.isArray(raw)
    ? raw.map((x) => String(x))
    : typeof raw === "string"
      ? [raw]
      : [];
  return labels
    .filter((l) => l.length > 0 && l !== NONE)
    .slice(0, max);
}
