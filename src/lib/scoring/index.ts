/**
 * Scoring-engine barrel file.
 *
 * `calculateAssessmentResult()` is the single entry point the API route
 * and UI should use — it bundles scoring, ROI, and insights into one
 * deterministic, synchronous call that runs in well under 10ms.
 */

import type {
  AssessmentResponse,
  ReadinessTier,
  RecommendedNextStep,
  ScoreBreakdown,
} from "@/types/assessment";

import {
  calculateDimensionScores,
  calculateDomainScore,
  calculateOverallScore,
  determineReadinessTier,
  determineRecommendedNextStep,
} from "./calculateScores";
import { calculateROI, type ROIEstimate } from "./calculateROI";
import { generateInsights, type Insight } from "./generateInsights";

export interface AssessmentResult {
  scores: ScoreBreakdown;
  tier: ReadinessTier;
  recommendedNextStep: RecommendedNextStep;
  roi: ROIEstimate;
  insights: Insight[];
}

export function calculateAssessmentResult(
  responses: AssessmentResponse,
): AssessmentResult {
  const domainScores = calculateDimensionScores(responses);
  const overall = calculateOverallScore(domainScores);
  const scores: ScoreBreakdown = { ...domainScores, overall };

  const tier = determineReadinessTier(overall);
  const recommendedNextStep = determineRecommendedNextStep(
    tier,
    responses,
    scores,
  );
  const roi = calculateROI(responses, tier);
  const insights = generateInsights(scores, responses);

  return { scores, tier, recommendedNextStep, roi, insights };
}

// Re-exports so callers can `import { ... } from "@/lib/scoring"`.
export {
  calculateDimensionScores,
  calculateDomainScore,
  calculateOverallScore,
  determineReadinessTier,
  determineRecommendedNextStep,
  calculateROI,
  generateInsights,
};

export type {
  AssessmentResponse,
  Insight,
  ReadinessTier,
  RecommendedNextStep,
  ROIEstimate,
  ScoreBreakdown,
};
export type { InsightSeverity } from "./generateInsights";
