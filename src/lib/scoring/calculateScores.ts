/**
 * Scoring engine for the Tulsa AI Readiness Index.
 *
 * Reads from the data-driven question bank (`src/lib/questions`) so copy and
 * weight tweaks don't require code changes here.
 *
 * See `src/lib/questions/types.ts` for the formal scoring formula and the
 * rationale for max-based multi-select aggregation.
 */

import type {
  BankDomain,
  BankQuestion,
  DomainId,
} from "@/lib/questions/types";
import {
  DOMAINS,
  getCopilotSupplementalForDomain,
  QUESTION_BANK,
  TIER_BANDS,
} from "@/lib/questions/bank";
import type {
  AssessmentAnswer,
  AssessmentResponse,
  DomainScores,
  ReadinessTier,
  RecommendedNextStep,
  ScoreBreakdown,
} from "@/types/assessment";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Coerce an answer into a string[] of selected values (labels). */
function toSelectedValues(answer: AssessmentAnswer | undefined): string[] {
  if (answer === undefined || answer === null) return [];
  if (Array.isArray(answer)) return answer.map(String).filter((s) => s.length > 0);
  if (typeof answer === "string") return answer.length > 0 ? [answer] : [];
  if (typeof answer === "number") return [String(answer)];
  if (typeof answer === "boolean") return [String(answer)];
  return [];
}

/** `true` if the question's `onlyIf` contingency is satisfied (or absent). */
function contingencyMet(
  question: BankQuestion,
  responses: AssessmentResponse,
): boolean {
  if (!question.onlyIf) return true;
  const trigger = new Set(toSelectedValues(responses[question.onlyIf.questionId]));
  return question.onlyIf.selectedAny.some((v) => trigger.has(v));
}

/**
 * Resolve the score_value that a response earned on one question.
 * Returns `null` if the question was unanswered (or contingency unmet) so
 * the caller can exclude it from both numerator and denominator.
 */
function questionScore(
  question: BankQuestion,
  responses: AssessmentResponse,
): number | null {
  if (!contingencyMet(question, responses)) return null;

  const selected = toSelectedValues(responses[question.id]);
  if (selected.length === 0) return null;

  const matched = question.options.filter((o) => selected.includes(o.label));
  if (matched.length === 0) return null;

  if (question.question_type === "multi_select") {
    // Max of selected option scores — the strongest capability signaled wins.
    return matched.reduce((max, o) => Math.max(max, o.score_value), 0);
  }

  // single_select: exactly one match expected; guard against multiple by
  // picking the highest (matches multi_select semantics and is safer than
  // a hard error for stale/odd data).
  return matched.reduce((max, o) => Math.max(max, o.score_value), 0);
}

/** Highest `score_value` available on a question (used for max_possible). */
function maxOptionScore(question: BankQuestion): number {
  return question.options.reduce((max, o) => Math.max(max, o.score_value), 0);
}

// -----------------------------------------------------------------------------
// Domain scoring
// -----------------------------------------------------------------------------

/**
 * Score a single domain 0-100 using the weighted formula:
 *
 *     Σ(question_score × weight) / Σ(max_option_score × weight) × 100
 *
 * Only answered questions are included in the denominator. Returns 0 when
 * no questions in the domain were answered.
 */
/**
 * Domain score for the main bank for this slice, plus any Copilot supplemental
 * questions in the same domain. Unanswered supplemental questions are ignored
 * (same as the core bank).
 */
export function calculateDomainScore(
  domain: BankDomain,
  responses: AssessmentResponse,
): number {
  const questions = [
    ...domain.questions,
    ...getCopilotSupplementalForDomain(domain.id),
  ];
  let earned = 0;
  let possible = 0;

  for (const q of questions) {
    const score = questionScore(q, responses);
    if (score === null) continue;
    earned += score * q.weight;
    possible += maxOptionScore(q) * q.weight;
  }

  if (possible === 0) return 0;
  return Math.round((earned / possible) * 100);
}

/**
 * Calculate the domain-level scores for an assessment.
 * Returns every domain as an integer 0-100.
 */
export function calculateDimensionScores(
  responses: AssessmentResponse,
): DomainScores {
  const byId: Partial<Record<DomainId, number>> = {};
  for (const domain of DOMAINS) {
    byId[domain.id] = calculateDomainScore(domain, responses);
  }
  return {
    dataSecurityCompliance: byId.data_security_compliance ?? 0,
    operationalProcessMaturity: byId.operational_process_maturity ?? 0,
    technologyInfrastructure: byId.technology_infrastructure ?? 0,
    teamChangeManagement: byId.team_change_management ?? 0,
    financialStrategicAlignment: byId.financial_strategic_alignment ?? 0,
  };
}

// -----------------------------------------------------------------------------
// Overall score — weighted rollup of the five domains using the JSON-defined
// domain weights (currently 25 / 25 / 20 / 15 / 15 = 100).
// -----------------------------------------------------------------------------

const DOMAIN_FIELD_BY_ID: Record<DomainId, keyof DomainScores> = {
  data_security_compliance: "dataSecurityCompliance",
  operational_process_maturity: "operationalProcessMaturity",
  technology_infrastructure: "technologyInfrastructure",
  team_change_management: "teamChangeManagement",
  financial_strategic_alignment: "financialStrategicAlignment",
};

export function calculateOverallScore(scores: DomainScores): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const domain of DOMAINS) {
    const field = DOMAIN_FIELD_BY_ID[domain.id];
    weightedSum += scores[field] * domain.weight;
    weightTotal += domain.weight;
  }
  if (weightTotal === 0) return 0;
  return Math.round(weightedSum / weightTotal);
}

// -----------------------------------------------------------------------------
// Readiness tier + recommended next step
// -----------------------------------------------------------------------------

/**
 * Map a 0-100 overall score onto a readiness tier using the bands defined
 * in the question bank (currently: foundation 0-39, exploration 40-59,
 * pilot 60-79, scale 80-100 — inclusive on both ends).
 */
export function determineReadinessTier(overallScore: number): ReadinessTier {
  const s = Math.max(0, Math.min(100, Math.round(overallScore)));
  const order: ReadinessTier[] = ["foundation", "exploration", "pilot", "scale"];
  for (const tier of order) {
    const band = TIER_BANDS[tier];
    if (s >= band.min && s <= band.max) return tier;
  }
  return "foundation";
}

/** Compliance labels that indicate regulated data is in play. */
const REGULATED_COMPLIANCE_LABELS = new Set<string>([
  "HIPAA (patient health information)",
  "Oklahoma Bar / attorney-client privilege",
  "State insurance regulations / NAIC data standards",
  "SOC 2 obligations to customers",
  "PCI-DSS (card payments)",
  "Oil & gas data sovereignty / operator MSA confidentiality",
]);

/** True if the respondent indicated they handle regulated data. */
function handlesRegulatedData(responses: AssessmentResponse): boolean {
  const selections = toSelectedValues(responses["ds_compliance_requirements"]);
  return selections.some((s) => REGULATED_COMPLIANCE_LABELS.has(s));
}

/**
 * Compute the recommended next step ("what to sell them") from tier +
 * responses. Normally tier alone drives this, but we override to
 * `foundation_work` when the respondent handles regulated data yet scores
 * low on data-security posture — you cannot responsibly deploy AI on top
 * of a compliance gap.
 */
export function determineRecommendedNextStep(
  tier: ReadinessTier,
  responses: AssessmentResponse,
  scores?: ScoreBreakdown,
): RecommendedNextStep {
  // Compliance gate — only checked when we have domain scores available.
  if (
    scores &&
    scores.dataSecurityCompliance < 40 &&
    handlesRegulatedData(responses)
  ) {
    return "foundation_work";
  }

  switch (tier) {
    case "foundation":
      return "foundation_work";
    case "exploration":
      return "audit";
    case "pilot":
      return "pilot";
    case "scale":
      return "retainer";
  }
}

// -----------------------------------------------------------------------------
// Re-exports so callers can write `import { TIER_BANDS } from '@/lib/scoring'`.
// -----------------------------------------------------------------------------

export { QUESTION_BANK, DOMAINS, TIER_BANDS };
export type { DomainScores, ScoreBreakdown };
