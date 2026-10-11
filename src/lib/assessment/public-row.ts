/** Lead contact details: dropped once results become shareable by link. */
const CONTACT_FIELDS = ["email", "phone", "full_name", "role_title"] as const;
/** Admin-only sales notes: never part of any public response. */
const ADMIN_FIELDS = ["call_brief", "call_brief_generated_at"] as const;

/**
 * The parts of an `assessments` row safe to send to whoever holds the id.
 * In-progress rows keep contact fields so the form can resume; completed
 * rows drop them because results links get shared.
 */
export function toPublicAssessment(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const key of ADMIN_FIELDS) delete out[key];
  if (row.status === "completed") {
    for (const key of CONTACT_FIELDS) delete out[key];
  }
  return out;
}
