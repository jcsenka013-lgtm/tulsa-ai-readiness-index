import { renderToBuffer } from "@react-pdf/renderer";

import { getDiscoveryCalendlyWithUtm } from "@/lib/calendly-utm";
import type { M365GapAnalysisReport } from "@/lib/m365-gap-analysis";
import type { Insight } from "@/lib/scoring/generateInsights";
import type { ROIEstimate } from "@/lib/scoring/calculateROI";
import type {
  Assessment,
  ProductType,
  ReadinessTier,
  RecommendedNextStep,
  ScoreBreakdown,
} from "@/types/assessment";

import { ReportDocument } from "@/lib/pdf/ReportDocument";

export type M365Analysis = M365GapAnalysisReport;

export interface GenerateReportPdfInput {
  assessment: Assessment;
  scores: ScoreBreakdown;
  tier: ReadinessTier;
  recommendedNextStep: RecommendedNextStep;
  roi: ROIEstimate;
  insights: Insight[];
  m365Analysis: M365Analysis | null;
}

function envString(key: string): string {
  const v = process.env[key];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Renders the branded Tulsa AI Readiness Index PDF and returns a Node buffer.
 * Intended for server-side use only (route handlers, scripts).
 */
export async function generateReportPDF(
  data: GenerateReportPdfInput,
): Promise<Buffer> {
  const fromEnv = envString("NEXT_PUBLIC_CALENDLY_URL") || envString("CALENDLY_URL");
  const calendlyUrl = fromEnv
    ? appendUtmToCalendlyUrl(fromEnv, data.assessment.id, data.assessment.productType)
    : getDiscoveryCalendlyWithUtm(data.assessment.productType, "pdf", {
        assessmentId: data.assessment.id,
      });
  const contactEmail =
    envString("NEXT_PUBLIC_TAA_CONTACT_EMAIL") || "hello@tulsaappliedai.com";
  const contactPhone = envString("NEXT_PUBLIC_TAA_CONTACT_PHONE");

  const element = (
    <ReportDocument
      assessment={data.assessment}
      scores={data.scores}
      tier={data.tier}
      recommendedNextStep={data.recommendedNextStep}
      roi={data.roi}
      insights={data.insights}
      m365Analysis={data.m365Analysis}
      calendlyUrl={calendlyUrl}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
    />
  );

  return renderToBuffer(element);
}

/** Preserves a custom Calendly base URL from env but adds UTM params for attribution. */
function appendUtmToCalendlyUrl(
  base: string,
  assessmentId: string,
  productType: ProductType,
): string {
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return base;
  }
  u.searchParams.set("utm_source", "tulsa_applied_ai");
  u.searchParams.set("utm_medium", "pdf");
  u.searchParams.set("utm_campaign", productType);
  u.searchParams.set("utm_content", assessmentId);
  return u.toString();
}
