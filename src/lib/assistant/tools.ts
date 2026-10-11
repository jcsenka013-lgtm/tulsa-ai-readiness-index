/**
 * Tools the results assistant can call. Each one reads from a single
 * completed assessment that the route loaded server-side, so the model never
 * chooses which assessment to look at and never sees contact details.
 */

import type Anthropic from "@anthropic-ai/sdk";

import { mergeResponsesWithFirmographics } from "@/lib/assessment/merge-responses";
import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
  type M365GapAnalysisReport,
} from "@/lib/m365-gap-analysis";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import {
  nextStepEngagementDetail,
  recommendedNextStepHeadline,
  recommendedNextStepShortCallout,
} from "@/lib/pdf/next-step-content";
import { TIER_DISPLAY } from "@/lib/pdf/tier-copy";
import {
  DOMAINS,
  getCopilotSupplementalForDomain,
  getDomain,
} from "@/lib/questions/bank";
import type { DomainId } from "@/lib/questions/types";
import { calculateAssessmentResult, type AssessmentResult } from "@/lib/scoring";
import { DOMAIN_FIELD_BY_ID } from "@/lib/scoring/calculateScores";
import type {
  AssessmentResponse,
  EmployeeCountRange,
  Industry,
  ProductType,
} from "@/types/assessment";

import { searchGuidance } from "./retrieval";

export interface AssistantContext {
  productType: ProductType;
  companyName: string;
  industry: string | null;
  employeeCountRange: string | null;
  responses: AssessmentResponse;
  result: AssessmentResult;
  m365: M365GapAnalysisReport | null;
}

/** Build the tool context from an `assessments` row (snake_case, as stored). */
export function buildAssistantContext(row: Record<string, unknown>): AssistantContext {
  const responses = mergeResponsesWithFirmographics(row);
  const industry = typeof row.industry === "string" ? row.industry : null;
  const employeeCountRange =
    typeof row.employee_count_range === "string" ? row.employee_count_range : null;
  const m365 =
    hasM365ResponseData(responses) && industry && employeeCountRange
      ? analyzeM365SecurityGaps(
          buildM365GapAnalysisInput(
            responses,
            industry as Industry,
            employeeCountRange as EmployeeCountRange,
          ),
        )
      : null;
  return {
    productType:
      row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness",
    companyName:
      typeof row.company_name === "string" && row.company_name.trim()
        ? row.company_name.trim().slice(0, 120)
        : "Your organization",
    industry,
    employeeCountRange,
    responses,
    result: calculateAssessmentResult(responses),
    m365,
  };
}

const DOMAIN_IDS = DOMAINS.map((d) => d.id) as DomainId[];

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_results_summary",
    description:
      "Returns this visitor's overall readiness score, tier, the five domain scores, " +
      "the recommended next step, the ROI estimate ranges, and the prioritized insights " +
      "from their report. Call this first for any question about their results.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_domain_answers",
    description:
      "Returns the questions this visitor answered in one scoring domain, the option " +
      "they picked, and how each answer scored (0 to 4). Use it to explain why a domain " +
      "scored the way it did or which answers would move the score.",
    input_schema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          enum: DOMAIN_IDS,
          description: "The scoring domain to inspect.",
        },
      },
      required: ["domain"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_guidance",
    description:
      "Semantic search over Tulsa Applied AI's published guidance: what each assessment " +
      "question checks and why it matters, Microsoft 365 / Copilot prerequisites, " +
      "readiness tiers, and engagement types. Use it when explaining a concept or " +
      "recommending what to do about a gap.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look up, phrased as a short question or topic.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_m365_analysis",
    description:
      "Returns the Microsoft 365 and Copilot gap analysis for this visitor: Copilot " +
      "readiness status, prerequisites, compliance gaps with remediation steps, quick " +
      "wins with admin-center paths, and a 90-day roadmap. Returns available=false when " +
      "they did not answer the Microsoft 365 questions.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "get_next_step_details",
    description:
      "Returns what Tulsa Applied AI's recommended engagement for this visitor includes, " +
      "its typical investment range, and its timeline.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
];

function summary(ctx: AssistantContext) {
  const { scores, tier, recommendedNextStep, roi, insights } = ctx.result;
  return {
    company: ctx.companyName,
    industry: ctx.industry,
    employee_count_range: ctx.employeeCountRange,
    overall_score: scores.overall,
    tier: TIER_DISPLAY[tier],
    domains: DOMAINS.map((d) => ({
      id: d.id,
      name: d.name,
      weight_percent: d.weight,
      score: scores[DOMAIN_FIELD_BY_ID[d.id]],
    })),
    recommended_next_step: recommendedNextStepHeadline(recommendedNextStep),
    roi_estimate_usd: {
      first_year_net_savings: [roi.firstYearNetSavingsLow, roi.firstYearNetSavingsHigh],
      recommended_investment: [roi.recommendedInvestmentLow, roi.recommendedInvestmentHigh],
      payback_months: [roi.paybackMonthsLow, roi.paybackMonthsHigh],
      assumptions_defaulted: {
        industry: roi.inputsUsed.industryDefaulted,
        hours_per_week: roi.inputsUsed.hoursPerWeekDefaulted,
      },
    },
    insights: insights.map((i) => ({
      severity: i.severity,
      domain: i.dimension,
      title: i.title,
      description: i.description,
      recommended_action: i.recommendedAction,
    })),
  };
}

function domainAnswers(ctx: AssistantContext, domainId: DomainId) {
  const domain = getDomain(domainId);
  const questions =
    ctx.productType === "copilot_readiness"
      ? [...domain.questions, ...getCopilotSupplementalForDomain(domainId)]
      : domain.questions;

  const answered = questions.flatMap((q) => {
    const raw = ctx.responses[q.id];
    const picked = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]).map(String);
    // Only report labels that exist in the bank; stored answers are client-written.
    const options = q.options.filter((o) => picked.includes(o.label));
    if (options.length === 0) return [];
    return [
      {
        question: q.text,
        answer: options.map((o) => o.label),
        score: Math.max(...options.map((o) => o.score_value)),
        max_score: Math.max(...q.options.map((o) => o.score_value)),
        weight: q.weight,
      },
    ];
  });

  return {
    domain: domain.name,
    score: ctx.result.scores[DOMAIN_FIELD_BY_ID[domainId]],
    answered_questions: answered,
    unanswered_count: questions.length - answered.length,
  };
}

function m365Analysis(ctx: AssistantContext) {
  if (!ctx.m365) return { available: false };
  const m = ctx.m365;
  return {
    available: true,
    copilot_relevance: m.copilot_relevance ?? null,
    license_tier: m.current_license_tier,
    copilot_readiness_status: m.copilot_readiness_status,
    prerequisites: m.copilot_prerequisites_status,
    compliance_gaps: m.compliance_gaps.slice(0, 6),
    quick_wins: m.quick_wins.slice(0, 5),
    recommended_upgrades: m.recommended_upgrades.slice(0, 4),
    roadmap: m.security_roadmap,
  };
}

function nextStepDetails(ctx: AssistantContext) {
  const step = ctx.result.recommendedNextStep;
  return {
    engagement: recommendedNextStepHeadline(step),
    summary: recommendedNextStepShortCallout(step),
    ...nextStepEngagementDetail(step),
  };
}

export class ToolInputError extends Error {}

/** Run one tool call and return the JSON string sent back as its result. */
export async function runAssistantTool(
  ctx: AssistantContext,
  name: string,
  input: unknown,
): Promise<string> {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case "get_results_summary":
      return JSON.stringify(summary(ctx));
    case "get_domain_answers": {
      const domain = args.domain;
      if (typeof domain !== "string" || !DOMAIN_IDS.includes(domain as DomainId)) {
        throw new ToolInputError(`domain must be one of: ${DOMAIN_IDS.join(", ")}`);
      }
      return JSON.stringify(domainAnswers(ctx, domain as DomainId));
    }
    case "search_guidance": {
      const query = args.query;
      if (typeof query !== "string" || !query.trim()) {
        throw new ToolInputError("query must be a non-empty string");
      }
      return JSON.stringify(await searchGuidance(query.slice(0, 300)));
    }
    case "get_m365_analysis":
      return JSON.stringify(m365Analysis(ctx));
    case "get_next_step_details":
      return JSON.stringify(nextStepDetails(ctx));
    default:
      throw new ToolInputError(`Unknown tool: ${name}`);
  }
}
