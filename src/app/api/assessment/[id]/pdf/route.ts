import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ensureAssessmentPdfSignedUrl } from "@/lib/assessment/pdf-report";
import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const regenerate = req.nextUrl.searchParams.get("regenerate") === "true";
  const supabase = createServiceClient();

  try {
    const { signedUrl, productType } = await ensureAssessmentPdfSignedUrl(supabase, id, {
      regenerate,
    });
    setSentryProductTypeTag(productType);
    return Response.json({ url: signedUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "Assessment not found") {
      return jsonError(msg, 404);
    }
    if (msg === "Assessment is not completed") {
      return jsonError(msg, 400);
    }
    console.error("PDF POST error:", err);
    return jsonError(msg, 500);
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const supabase = createServiceClient();

  try {
    const { signedUrl, productType } = await ensureAssessmentPdfSignedUrl(supabase, id, {
      regenerate: false,
    });
    setSentryProductTypeTag(productType);

    const { data: countRow, error: countErr } = await supabase
      .from("assessments")
      .select("pdf_download_count")
      .eq("id", id)
      .maybeSingle();

    if (!countErr && countRow) {
      const current = Number(
        (countRow as { pdf_download_count?: number }).pdf_download_count ?? 0,
      );
      await supabase
        .from("assessments")
        .update({ pdf_download_count: current + 1 })
        .eq("id", id);
    }

    return NextResponse.redirect(signedUrl, 302);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "Assessment not found") {
      return jsonError(msg, 404);
    }
    if (msg === "Assessment is not completed") {
      return jsonError(msg, 400);
    }
    console.error("PDF GET error:", err);
    return jsonError(msg, 500);
  }
}
