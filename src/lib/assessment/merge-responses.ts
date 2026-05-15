import type { AssessmentResponse } from "@/types/assessment";

/**
 * Merges firmographic columns on an assessment row into `responses` the way
 * the scoring and ROI layers expect.
 */
export function mergeResponsesWithFirmographics(
  row: Record<string, unknown>,
): AssessmentResponse {
  const base: AssessmentResponse = {
    ...((row.responses ?? {}) as AssessmentResponse),
  };
  if (row.industry) base.industry = String(row.industry);
  if (row.employee_count_range) {
    base.employee_count_range = String(row.employee_count_range);
  }
  if (row.annual_revenue_range) {
    base.annual_revenue_range = String(row.annual_revenue_range);
  }
  return base;
}
