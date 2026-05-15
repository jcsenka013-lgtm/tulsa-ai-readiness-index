import type { AssessmentResponse } from "@/types/assessment";

const COPILOT_SUPPLEMENTAL_QUESTION_IDS = [
  "COPILOT_LICENSE",
  "COPILOT_INTENT",
  "SHAREPOINT_OVERSHARING",
  "SENSITIVITY_LABELS",
  "DATA_HYGIENE_CADENCE",
] as const;

function hasNonEmptyResponse(v: unknown): boolean {
  if (typeof v === "string" && v.trim().length > 0) return true;
  if (Array.isArray(v) && v.length > 0) return true;
  return false;
}

/**
 * True when the respondent supplied explicit Microsoft 365 posture fields
 * and/or answers to the Copilot supplemental question set, so the M365
 * section is meaningful.
 */
export function hasM365ResponseData(responses: AssessmentResponse): boolean {
  for (const key of Object.keys(responses)) {
    if (!key.startsWith("m365_")) continue;
    if (hasNonEmptyResponse(responses[key])) return true;
  }
  for (const id of COPILOT_SUPPLEMENTAL_QUESTION_IDS) {
    if (hasNonEmptyResponse(responses[id])) return true;
  }
  return false;
}
