import {
  checkAssessmentCreateLimit,
  getClientIpFromRequest,
} from "@/lib/rate-limit/assessment-create";
import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types/assessment";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function parseProductType(v: unknown): ProductType {
  if (v === "copilot_readiness" || v === "ai_readiness") {
    return v;
  }
  return "ai_readiness";
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const product_type = parseProductType(body.product_type);

  setSentryProductTypeTag(product_type);

  const ip = getClientIpFromRequest(request);
  const limit = checkAssessmentCreateLimit(ip, product_type);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  const utm_source =
    typeof body.utm_source === "string" ? body.utm_source : null;
  const utm_medium =
    typeof body.utm_medium === "string" ? body.utm_medium : null;
  const utm_campaign =
    typeof body.utm_campaign === "string" ? body.utm_campaign : null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      status: "in_progress",
      product_type,
      utm_source,
      utm_medium,
      utm_campaign,
      responses: {},
    })
    .select("id")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }
  if (!data) {
    return jsonError("Failed to create assessment", 500);
  }

  return Response.json({ id: data.id, product_type });
}
