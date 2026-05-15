import { getAIReadinessSlicesByDomain } from "@/lib/questions/copilotQuestionSet";
import type { DomainQuestionSlice } from "@/lib/questions/types";

/** @deprecated Use DomainQuestionSlice; kept for existing imports. */
export type FreeTierDomainSlice = DomainQuestionSlice;

/**
 * Free-tier questions only, grouped by domain in bank order (steps 3–7).
 * Sourced from `getAIReadinessSlicesByDomain` so the AI product stays in sync
 * with the curated bank logic.
 */
export const FREE_TIER_BY_DOMAIN: readonly DomainQuestionSlice[] =
  getAIReadinessSlicesByDomain();
