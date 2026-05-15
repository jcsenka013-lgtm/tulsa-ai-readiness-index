import { render } from "@react-email/render";
import type { ReactElement } from "react";

import {
  EMAIL_PREVIEW_FIXTURES,
  buildPreviewResult,
  getEmailPreviewFixture,
  previewNames,
  previewTopOpportunity,
  previewTopTwo,
  type EmailFixtureId,
} from "@/lib/email/email-fixtures";
import { firstInsightTitle } from "@/lib/email/helpers";
import { AbandonedRecoveryEmail } from "@/lib/email/templates/AbandonedRecoveryEmail";
import { FollowUp24HourEmail } from "@/lib/email/templates/FollowUp24HourEmail";
import { FollowUp72HourEmail } from "@/lib/email/templates/FollowUp72HourEmail";
import { FollowUp7DayEmail } from "@/lib/email/templates/FollowUp7DayEmail";
import { ResultsReadyEmail } from "@/lib/email/templates/ResultsReadyEmail";
import type { ProductType } from "@/types/assessment";

export const dynamic = "force-dynamic";

function parseProductType(v: string | null): ProductType {
  return v === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
}

function previewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_PREVIEW === "true";
}

export async function GET(request: Request): Promise<Response> {
  if (!previewEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") ?? "results_ready";
  const fixtureId = (searchParams.get("fixture") ?? "medium_exploration") as EmailFixtureId;
  const productType = parseProductType(searchParams.get("product"));

  const fixture =
    EMAIL_PREVIEW_FIXTURES.find((f) => f.id === fixtureId) ?? getEmailPreviewFixture("medium_exploration");
  const result = buildPreviewResult(fixture);
  const { firstName, companyName } = previewNames(fixture);
  const leadEmail = fixture.leadEmail;

  let element: ReactElement;
  switch (template) {
    case "results_ready":
      element = (
        <ResultsReadyEmail
          firstName={firstName}
          companyName={companyName}
          assessmentId={fixture.assessmentId}
          productType={productType}
          tier={result.tier}
          overallScore={result.scores.overall}
          topInsights={previewTopTwo(result)}
          recommendedNextStep={result.recommendedNextStep}
          leadEmail={leadEmail}
        />
      );
      break;
    case "followup_24h":
      element = (
        <FollowUp24HourEmail
          firstName={firstName}
          companyName={companyName}
          assessmentId={fixture.assessmentId}
          productType={productType}
          tier={result.tier}
          topInsightTitle={firstInsightTitle(result.insights)}
          recommendedNextStep={result.recommendedNextStep}
          leadEmail={leadEmail}
        />
      );
      break;
    case "followup_72h":
      element = (
        <FollowUp72HourEmail
          firstName={firstName}
          companyName={companyName}
          assessmentId={fixture.assessmentId}
          productType={productType}
          topOpportunity={previewTopOpportunity(fixture)}
          topInsightTitle={firstInsightTitle(result.insights)}
          recommendedNextStep={result.recommendedNextStep}
          leadEmail={leadEmail}
        />
      );
      break;
    case "followup_7day":
      element = (
        <FollowUp7DayEmail
          firstName={firstName}
          companyName={companyName}
          assessmentId={fixture.assessmentId}
          productType={productType}
          leadEmail={leadEmail}
        />
      );
      break;
    case "abandoned_recovery":
      element = (
        <AbandonedRecoveryEmail
          firstName={firstName}
          assessmentId={fixture.assessmentId}
          productType={productType}
          leadEmail={leadEmail}
        />
      );
      break;
    default:
      return new Response("Unknown template", { status: 400 });
  }

  const html = await render(element);
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
