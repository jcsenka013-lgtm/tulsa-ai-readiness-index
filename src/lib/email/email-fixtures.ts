import { calculateAssessmentResult } from "@/lib/scoring";
import {
  HIGH_RESPONSES,
  LOW_RESPONSES,
  MEDIUM_RESPONSES,
} from "@/lib/scoring/__tests__/fixtures";
import type { AssessmentResponse } from "@/types/assessment";

import {
  firstInsightTitle,
  firstNameFromFullName,
  topOpportunityFromResponses,
  topTwoInsightBlurbs,
} from "@/lib/email/helpers";
import type { Insight } from "@/lib/scoring";

const DEMO_ID = "00000000-0000-4000-8000-000000000001";

export type EmailFixtureId = "low_foundation" | "medium_exploration" | "high_scale";

export function getFixtureAssessmentResponse(id: EmailFixtureId): AssessmentResponse {
  switch (id) {
    case "low_foundation":
      return { ...LOW_RESPONSES };
    case "medium_exploration":
      return { ...MEDIUM_RESPONSES };
    case "high_scale":
      return { ...HIGH_RESPONSES };
    default:
      return { ...MEDIUM_RESPONSES };
  }
}

export interface EmailPreviewFixture {
  id: EmailFixtureId;
  label: string;
  assessmentId: string;
  leadEmail: string;
  fullName: string;
  companyName: string;
  responses: AssessmentResponse;
}

export const EMAIL_PREVIEW_FIXTURES: EmailPreviewFixture[] = [
  {
    id: "low_foundation",
    label: "Low / foundation",
    assessmentId: DEMO_ID,
    leadEmail: "alex.jordan@example-dental.com",
    fullName: "Alex Jordan",
    companyName: "Peaks Family Dentistry",
    responses: getFixtureAssessmentResponse("low_foundation"),
  },
  {
    id: "medium_exploration",
    label: "Medium / exploration",
    assessmentId: DEMO_ID,
    leadEmail: "sam.rivera@example-insurance.com",
    fullName: "Sam Rivera",
    companyName: "Redbud Risk Partners",
    responses: getFixtureAssessmentResponse("medium_exploration"),
  },
  {
    id: "high_scale",
    label: "High / scale",
    assessmentId: DEMO_ID,
    leadEmail: "jordan.kim@example-legal.com",
    fullName: "Jordan Kim",
    companyName: "Kim & Holt PLLC",
    responses: getFixtureAssessmentResponse("high_scale"),
  },
];

export function getEmailPreviewFixture(id: EmailFixtureId): EmailPreviewFixture {
  return EMAIL_PREVIEW_FIXTURES.find((f) => f.id === id) ?? EMAIL_PREVIEW_FIXTURES[1];
}

export function buildPreviewResult(fixture: EmailPreviewFixture) {
  return calculateAssessmentResult(fixture.responses);
}

export function previewNames(fixture: EmailPreviewFixture) {
  return {
    firstName: firstNameFromFullName(fixture.fullName),
    companyName: fixture.companyName,
  };
}

export function previewTopOpportunity(fixture: EmailPreviewFixture) {
  return topOpportunityFromResponses(fixture.responses as Record<string, unknown>);
}

export function previewTopInsightTitle(result: ReturnType<typeof calculateAssessmentResult>) {
  return firstInsightTitle(result.insights);
}

export function previewTopTwo(result: {
  insights: Insight[];
}): { title: string; line: string }[] {
  return topTwoInsightBlurbs(result.insights);
}
