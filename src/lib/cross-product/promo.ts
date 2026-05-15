import type { AssessmentResponse, ProductType, ScoreBreakdown } from "@/types/assessment";

const M365_LABEL_PREFIX = "Microsoft 365 (Outlook, Teams, SharePoint)";

/**
 * General AI Readiness: primary productivity = M365 in firmographic bank.
 */
export function responseIndicatesM365PrimaryProductivity(
  responses: AssessmentResponse,
): boolean {
  const v = responses.tech_productivity_suite;
  return typeof v === "string" && v.startsWith(M365_LABEL_PREFIX);
}

/**
 * "Low" technology infrastructure (domain 0–100) — used for cross-sell to Copilot.
 */
export function isLowTechnologyInfrastructureScore(technologyInfrastructure: number): boolean {
  return technologyInfrastructure < 50;
}

export function shouldShowCopilotCrossSell(args: {
  productType: ProductType;
  scores: ScoreBreakdown;
  responses: AssessmentResponse;
}): boolean {
  if (args.productType !== "ai_readiness") return false;
  if (!responseIndicatesM365PrimaryProductivity(args.responses)) return false;
  if (!isLowTechnologyInfrastructureScore(args.scores.technologyInfrastructure)) {
    return false;
  }
  return true;
}

/**
 * Copilot assessment: not an M365 tenant (supplemental signal / gap analysis).
 */
export function isNotM365TenantFromSignals(m365Signals: string[] | undefined): boolean {
  if (!m365Signals?.length) return false;
  return m365Signals.includes("not_m365_tenant");
}

/**
 * When a user takes the Copilot readiness assessment but their supplemental
 * answers indicate they aren't on Microsoft 365, we soft-redirect them to the
 * general AI Readiness Index. Accepts either the raw supplemental signals
 * array or the derived `copilot_relevance.status` from the M365 gap engine.
 */
export function shouldShowAiReadinessCrossSell(args: {
  productType: ProductType;
  m365Signals?: string[];
  copilotRelevanceStatus?: "microsoft_365_tenant" | "not_microsoft_365_tenant" | null;
}): boolean {
  if (args.productType !== "copilot_readiness") return false;
  if (args.copilotRelevanceStatus === "not_microsoft_365_tenant") return true;
  if (isNotM365TenantFromSignals(args.m365Signals)) return true;
  return false;
}
