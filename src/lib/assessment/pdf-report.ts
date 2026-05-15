import type { SupabaseClient } from "@supabase/supabase-js";

import { assessmentFromRow } from "@/lib/assessment/assessment-from-row";
import { mergeResponsesWithFirmographics } from "@/lib/assessment/merge-responses";
import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
} from "@/lib/m365-gap-analysis";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import { generateReportPDF } from "@/lib/pdf/generatePDF";
import { calculateAssessmentResult } from "@/lib/scoring";
import type { EmployeeCountRange, Industry, ProductType } from "@/types/assessment";

const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;
const BUCKET = "reports";

function objectPathForAssessment(id: string, storedPdfUrl: string | null): string {
  if (!storedPdfUrl || storedPdfUrl.startsWith("http")) {
    return `${id}.pdf`;
  }
  return storedPdfUrl.includes("/") ? storedPdfUrl.split("/").pop() ?? `${id}.pdf` : storedPdfUrl;
}

async function signReport(
  supabase: SupabaseClient,
  objectPath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) {
    throw new Error(
      `Failed to create signed URL: ${error?.message ?? "unknown error"}`,
    );
  }
  return data.signedUrl;
}

/**
 * Ensures a PDF exists in Storage (unless `regenerate` forces a rebuild),
 * persists `pdf_url`, and returns a fresh 7-day signed URL.
 */
export async function ensureAssessmentPdfSignedUrl(
  supabase: SupabaseClient,
  assessmentId: string,
  opts?: { regenerate?: boolean },
): Promise<{ signedUrl: string; objectPath: string; productType: ProductType }> {
  const regenerate = Boolean(opts?.regenerate);

  const { data: rowUnknown, error: loadErr } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .maybeSingle();

  if (loadErr) {
    throw new Error(`Failed to load assessment: ${loadErr.message}`);
  }
  if (!rowUnknown) {
    throw new Error("Assessment not found");
  }

  const row = rowUnknown as Record<string, unknown>;
  if (String(row.status) !== "completed") {
    throw new Error("Assessment is not completed");
  }

  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";

  const objectPath = objectPathForAssessment(assessmentId, row.pdf_url ? String(row.pdf_url) : null);

  if (row.pdf_url && !regenerate) {
    try {
      const signedUrl = await signReport(supabase, objectPath);
      return { signedUrl, objectPath, productType };
    } catch {
      // Stored path may be stale — fall through and regenerate.
    }
  }

  const merged = mergeResponsesWithFirmographics(row);
  const result = calculateAssessmentResult(merged);

  const industry = (row.industry ?? "other") as Industry;
  const employeeCountRange = (row.employee_count_range ?? "1-5") as EmployeeCountRange;

  const m365Analysis = hasM365ResponseData(merged)
    ? analyzeM365SecurityGaps(
        buildM365GapAnalysisInput(merged, industry, employeeCountRange),
      )
    : null;

  const assessment = assessmentFromRow(row);

  const buffer = await generateReportPDF({
    assessment,
    scores: result.scores,
    tier: result.tier,
    recommendedNextStep: result.recommendedNextStep,
    roi: result.roi,
    insights: result.insights,
    m365Analysis,
  });

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (uploadErr) {
    throw new Error(`Failed to upload PDF: ${uploadErr.message}`);
  }

  const { error: updateErr } = await supabase
    .from("assessments")
    .update({ pdf_url: objectPath })
    .eq("id", assessmentId);

  if (updateErr) {
    throw new Error(`Failed to update pdf_url: ${updateErr.message}`);
  }

  const signedUrl = await signReport(supabase, objectPath);
  return { signedUrl, objectPath, productType };
}
