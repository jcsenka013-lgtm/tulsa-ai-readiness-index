import * as React from "react";

import { sendEmail } from "@/lib/email/client";
import {
  firstInsightTitle,
  firstNameFromFullName,
  topOpportunityFromResponses,
} from "@/lib/email/helpers";
import { AbandonedRecoveryEmail } from "@/lib/email/templates/AbandonedRecoveryEmail";
import { FollowUp24HourEmail } from "@/lib/email/templates/FollowUp24HourEmail";
import { FollowUp72HourEmail } from "@/lib/email/templates/FollowUp72HourEmail";
import { FollowUp7DayEmail } from "@/lib/email/templates/FollowUp7DayEmail";
import type { EmailType } from "@/lib/email/email-types";
import { createServiceClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/lib/products/productConfig";
import { calculateAssessmentResult } from "@/lib/scoring";
import type { AssessmentResponse, ProductType } from "@/types/assessment";

const MAX_PER_RUN = 50;

interface AssessmentRow {
  id: string;
  product_type: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  industry: string | null;
  employee_count_range: string | null;
  annual_revenue_range: string | null;
  responses: AssessmentResponse | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

function productFromRow(row: AssessmentRow): ProductType {
  return row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
}

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

async function loadSentTypes(
  supabase: ReturnType<typeof createServiceClient>,
  type: EmailType,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("email_log")
    .select("assessment_id")
    .eq("email_type", type);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.assessment_id as string));
}

function cutoffIso(msAgo: number): string {
  return new Date(Date.now() - msAgo).toISOString();
}

export interface CronEmailSummary {
  sent: number;
  skipped: number;
  errors: string[];
}

export async function runEmailSequenceCron(): Promise<CronEmailSummary> {
  const supabase = createServiceClient();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  const trySend = async (
    row: AssessmentRow,
    email: string,
    emailType: EmailType,
    subject: string,
    element: React.ReactElement,
  ): Promise<boolean> => {
    if (sent >= MAX_PER_RUN) return false;
    const r = await sendEmail({
      to: email,
      subject,
      reactElement: element,
      assessmentId: row.id,
      emailType,
    });
    if (r.outcome === "skipped") skipped += 1;
    else if (r.outcome === "sent") {
      sent += 1;
      return true;
    } else errors.push(`${row.id} ${emailType}: ${r.error}`);
    return false;
  };

  const sent24 = await loadSentTypes(supabase, "followup_24h");
  const sent72 = await loadSentTypes(supabase, "followup_72h");
  const sent7 = await loadSentTypes(supabase, "followup_7day");
  const sentAb = await loadSentTypes(supabase, "abandoned_recovery");
  /** 24h must be logged before 72h; 72h before 7d (same run + prior crons). */
  const mailed24 = new Set(sent24);
  const mailed72 = new Set(sent72);

  const { data: completedPool } = await supabase
    .from("assessments")
    .select(
      "id,product_type,email,full_name,company_name,industry,employee_count_range,annual_revenue_range,responses,status,completed_at,created_at",
    )
    .eq("status", "completed")
    .is("booked_call_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .order("completed_at", { ascending: true })
    .limit(120);

  const completedRows = (completedPool ?? []) as AssessmentRow[];

  const queue24 = completedRows.filter(
    (r) =>
      r.completed_at &&
      r.completed_at <= cutoffIso(24 * 60 * 60 * 1000) &&
      !sent24.has(r.id),
  );

  for (const row of queue24) {
    if (sent >= MAX_PER_RUN) break;
    const email = row.email!.toLowerCase();
    const pt = productFromRow(row);
    const merged = responsesWithFirmographics(row);
    const result = calculateAssessmentResult(merged);
    const company = row.company_name?.trim() || "your organization";
    const ok = await trySend(
      row,
      email,
      "followup_24h",
      `Quick thought on your ${company} assessment`,
      <FollowUp24HourEmail
        firstName={firstNameFromFullName(row.full_name)}
        companyName={company}
        assessmentId={row.id}
        productType={pt}
        tier={result.tier}
        topInsightTitle={firstInsightTitle(result.insights)}
        recommendedNextStep={result.recommendedNextStep}
        leadEmail={email}
      />,
    );
    if (ok) mailed24.add(row.id);
  }

  const queue72 = completedRows.filter(
    (r) =>
      r.completed_at &&
      r.completed_at <= cutoffIso(72 * 60 * 60 * 1000) &&
      mailed24.has(r.id) &&
      !sent72.has(r.id),
  );
  const queue7 = completedRows.filter(
    (r) =>
      r.completed_at &&
      r.completed_at <= cutoffIso(7 * 24 * 60 * 60 * 1000) &&
      mailed72.has(r.id) &&
      !sent7.has(r.id),
  );

  for (const row of queue72) {
    if (sent >= MAX_PER_RUN) break;
    const email = row.email!.toLowerCase();
    const pt = productFromRow(row);
    const merged = responsesWithFirmographics(row);
    const result = calculateAssessmentResult(merged);
    const company = row.company_name?.trim() || "your organization";
    const topOpp = topOpportunityFromResponses(merged as Record<string, unknown>);
    const ok72 = await trySend(
      row,
      email,
      "followup_72h",
      "One specific opportunity I saw in your results",
      <FollowUp72HourEmail
        firstName={firstNameFromFullName(row.full_name)}
        companyName={company}
        assessmentId={row.id}
        productType={pt}
        topOpportunity={topOpp}
        topInsightTitle={firstInsightTitle(result.insights)}
        recommendedNextStep={result.recommendedNextStep}
        leadEmail={email}
      />,
    );
    if (ok72) mailed72.add(row.id);
  }

  for (const row of queue7) {
    if (sent >= MAX_PER_RUN) break;
    const email = row.email!.toLowerCase();
    const pt = productFromRow(row);
    const company = row.company_name?.trim() || "your organization";
    await trySend(
      row,
      email,
      "followup_7day",
      `Last note on your ${PRODUCTS[pt].shortName} assessment`,
      <FollowUp7DayEmail
        firstName={firstNameFromFullName(row.full_name)}
        companyName={company}
        assessmentId={row.id}
        productType={pt}
        leadEmail={email}
      />,
    );
  }

  const { data: abandonedPool } = await supabase
    .from("assessments")
    .select(
      "id,product_type,email,full_name,company_name,industry,employee_count_range,annual_revenue_range,responses,status,completed_at,created_at",
    )
    .eq("status", "in_progress")
    .not("email", "is", null)
    .neq("email", "")
    .lte("created_at", cutoffIso(2 * 60 * 60 * 1000))
    .order("created_at", { ascending: true })
    .limit(80);

  const abandonedRows = (abandonedPool ?? []) as AssessmentRow[];

  for (const row of abandonedRows) {
    if (sent >= MAX_PER_RUN) break;
    if (sentAb.has(row.id)) continue;
    const email = row.email!.toLowerCase();
    const pt = productFromRow(row);
    await trySend(
      row,
      email,
      "abandoned_recovery",
      `Your ${PRODUCTS[pt].shortName} — 3 minutes to finish`,
      <AbandonedRecoveryEmail
        firstName={firstNameFromFullName(row.full_name)}
        assessmentId={row.id}
        productType={pt}
        leadEmail={email}
      />,
    );
  }

  return { sent, skipped, errors };
}
