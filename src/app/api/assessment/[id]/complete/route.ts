/**
 * POST /api/assessment/[id]/complete
 *
 * Finalises an assessment: runs the scoring engine, persists the scores +
 * tier + recommended next step + ROI snapshot back onto the row, upserts a
 * lead record (if we captured an email), and returns the full result
 * payload so the client can render the results page without a round-trip.
 *
 * Idempotent: re-POSTing to a completed assessment returns the stored
 * result instead of re-scoring, so the client can safely retry network
 * failures without double-processing.
 *
 * Sends results email + Slack lead alert (fire-and-forget); idempotent on
 * email via `email_log`.
 */

import type { NextRequest } from "next/server";
import { createElement } from "react";

import { sendEmail } from "@/lib/email/client";
import {
  firstNameFromFullName,
  industryLabel,
  recommendedNextStepLabel,
  topTwoInsightBlurbs,
} from "@/lib/email/helpers";
import { ResultsReadyEmail } from "@/lib/email/templates/ResultsReadyEmail";
import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { notifyError, notifyNewLead } from "@/lib/notifications/slack";
import { PRODUCTS } from "@/lib/products/productConfig";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateAssessmentResult } from "@/lib/scoring";
import type {
  AssessmentResponse,
  ProductType,
  ReadinessTier,
  RecommendedNextStep,
} from "@/types/assessment";

export const dynamic = "force-dynamic";

// -----------------------------------------------------------------------------
// Row shape as returned by supabase-js (snake_case columns).
// -----------------------------------------------------------------------------

interface AssessmentRow {
  id: string;
  status: string;
  product_type?: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  industry: string | null;
  employee_count_range: string | null;
  annual_revenue_range: string | null;
  responses: AssessmentResponse | null;

  data_security_compliance_score: number | null;
  operational_process_maturity_score: number | null;
  technology_infrastructure_score: number | null;
  team_change_management_score: number | null;
  financial_strategic_alignment_score: number | null;
  overall_score: number | null;
  readiness_tier: string | null;
  recommended_next_step: string | null;
  estimated_annual_savings: number | null;
  estimated_payback_months: number | null;
  completed_at: string | null;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Merge the typed firmographic columns back into `responses` before scoring,
 * because `calculateROI` reads them from the `responses` bag. This keeps the
 * scoring engine schema-agnostic and the source of truth at the DB row.
 */
function responsesWithFirmographics(row: AssessmentRow): AssessmentResponse {
  const base: AssessmentResponse = { ...(row.responses ?? {}) };
  if (row.industry) base.industry = row.industry;
  if (row.employee_count_range) {
    base.employee_count_range = row.employee_count_range;
  }
  if (row.annual_revenue_range) {
    base.annual_revenue_range = row.annual_revenue_range;
  }
  return base;
}

/**
 * Average the low/high ROI bands into a single "headline" number for the
 * `estimated_annual_savings` column. The full range is preserved in the
 * response body for the report UI.
 */
function headlineSavings(low: number, high: number): number {
  return Math.round((low + high) / 2);
}

function headlinePayback(low: number, high: number): number {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return 0;
  return Math.round(((low + high) / 2) * 10) / 10;
}

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/assessment/[id]/complete">,
): Promise<Response> {
  const { id } = await ctx.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const supabase = createServiceClient();

  const { data: rowUnknown, error: loadErr } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    return jsonError(`Failed to load assessment: ${loadErr.message}`, 500);
  }
  if (!rowUnknown) {
    return jsonError("Assessment not found", 404);
  }

  const row = rowUnknown as AssessmentRow;
  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
  setSentryProductTypeTag(productType);
  const wasAlreadyComplete = row.status === "completed";

  // Run the scoring engine (deterministic from stored responses).
  const mergedResponses = responsesWithFirmographics(row);
  const result = calculateAssessmentResult(mergedResponses);

  // Persist score columns (idempotent — re-running yields the same values
  // for the same responses).
  const { data: updatedUnknown, error: updateErr } = await supabase
    .from("assessments")
    .update({
      status: "completed",
      completed_at: row.completed_at ?? new Date().toISOString(),

      data_security_compliance_score: result.scores.dataSecurityCompliance,
      operational_process_maturity_score: result.scores.operationalProcessMaturity,
      technology_infrastructure_score: result.scores.technologyInfrastructure,
      team_change_management_score: result.scores.teamChangeManagement,
      financial_strategic_alignment_score: result.scores.financialStrategicAlignment,
      overall_score: result.scores.overall,

      readiness_tier: result.tier,
      recommended_next_step: result.recommendedNextStep,

      estimated_annual_savings: headlineSavings(
        result.roi.automationPotentialLow,
        result.roi.automationPotentialHigh,
      ),
      estimated_payback_months: headlinePayback(
        result.roi.paybackMonthsLow,
        result.roi.paybackMonthsHigh,
      ),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return jsonError(`Failed to save results: ${updateErr.message}`, 500);
  }

  // Upsert the lead record — idempotent on (lower(email)).
  //
  // The unique index on `leads` is functional (`on leads (lower(email))`),
  // so PostgREST's native `upsert` with `onConflict` doesn't target it.
  // We do a read-then-insert instead; any race loses a row at worst, which
  // the `leads_email_uniq_idx` index catches.
  if (row.email && row.email.length > 0) {
    const emailLower = row.email.toLowerCase();

    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .ilike("email", emailLower)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase.from("leads").insert({
        assessment_id: row.id,
        email: emailLower,
        full_name: row.full_name,
        company_name: row.company_name,
        phone: row.phone,
        source_product: productType,
      });
      if (insertErr && insertErr.code !== "23505") {
        // 23505 = unique_violation (race condition). Anything else we log.
        console.error("Failed to create lead row:", insertErr);
      }
    }
  }

  if (!wasAlreadyComplete) {
    const companyName = row.company_name?.trim() || "Your organization";
    const leadEmail = row.email?.trim().toLowerCase() ?? "";
    const priorityRaw = mergedResponses["priority_next_6_months"];
    const biggestPriority =
      typeof priorityRaw === "string" && priorityRaw.trim() ? priorityRaw.trim() : null;

    void (async () => {
      if (leadEmail) {
        try {
          const sendRes = await sendEmail({
            to: leadEmail,
            subject: `Your ${PRODUCTS[productType].shortName} — ${companyName}`,
            assessmentId: row.id,
            emailType: "results_ready",
            reactElement: createElement(ResultsReadyEmail, {
              firstName: firstNameFromFullName(row.full_name),
              companyName,
              assessmentId: row.id,
              productType,
              tier: result.tier,
              overallScore: result.scores.overall,
              topInsights: topTwoInsightBlurbs(result.insights),
              recommendedNextStep: result.recommendedNextStep,
              leadEmail,
            }),
          });
          if (sendRes.outcome === "failed") {
            console.error("Results email failed:", sendRes.error);
            notifyError(new Error(sendRes.error), {
              assessmentId: row.id,
              step: "send_results_email",
            });
          }
        } catch (e) {
          console.error("Results email threw:", e);
          notifyError(e, { assessmentId: row.id, step: "send_results_email" });
        }
      }

      try {
        notifyNewLead({
          productType,
          companyName: row.company_name,
          overallScore: result.scores.overall,
          tier: result.tier as ReadinessTier,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          industry: row.industry,
          industryLabel: industryLabel(row.industry),
          recommendedNextStep: result.recommendedNextStep as RecommendedNextStep,
          recommendedNextStepLabel: recommendedNextStepLabel(
            result.recommendedNextStep as RecommendedNextStep,
          ),
          biggestPriority,
          assessmentId: row.id,
        });
      } catch (e) {
        console.error("Slack notifyNewLead failed:", e);
      }
    })();
  }

  return Response.json({
    product_type: productType,
    assessment: updatedUnknown,
    scores: result.scores,
    tier: result.tier,
    recommendedNextStep: result.recommendedNextStep,
    roi: result.roi,
    insights: result.insights,
  });
}
