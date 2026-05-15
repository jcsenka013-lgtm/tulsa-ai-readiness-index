import type { NextRequest } from "next/server";

import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { notifyBookedCall } from "@/lib/notifications/slack";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types/assessment";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("assessments")
    .select("id, full_name, company_name, product_type")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonError(`Failed to load assessment: ${error.message}`, 500);
  }
  if (!row) {
    return jsonError("Assessment not found", 404);
  }

  const { error: upErr } = await supabase
    .from("assessments")
    .update({ booked_call_at: new Date().toISOString() })
    .eq("id", id);

  if (upErr) {
    return jsonError(`Failed to update: ${upErr.message}`, 500);
  }

  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
  setSentryProductTypeTag(productType);

  void (async () => {
    try {
      notifyBookedCall({
        productType,
        fullName: row.full_name,
        companyName: row.company_name,
      });
    } catch {
      // fire-and-forget
    }
  })();

  return Response.json({ ok: true, booked_call_at: new Date().toISOString() });
}
