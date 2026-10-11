import Anthropic from "@anthropic-ai/sdk";

import { CallBriefError, generateCallBrief } from "@/lib/assistant/call-brief";
import { buildAssistantContext } from "@/lib/assistant/tools";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * POST /admin/leads/[id]/brief — generate (or regenerate) the pre-call brief
 * for a completed assessment. Behind the /admin Basic Auth in src/proxy.ts.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("ANTHROPIC_API_KEY is not set", 503);
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("assessments")
    .select(
      "id, status, product_type, company_name, role_title, industry, employee_count_range, annual_revenue_range, responses",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Call brief load failed:", error);
    return jsonError("Failed to load assessment", 500);
  }
  if (!row) return jsonError("Assessment not found", 404);
  if (row.status !== "completed") return jsonError("Assessment is not complete", 409);

  try {
    const brief = await generateCallBrief(
      buildAssistantContext(row),
      typeof row.role_title === "string" ? row.role_title : null,
    );
    const generatedAt = new Date().toISOString();
    const { error: saveErr } = await supabase
      .from("assessments")
      .update({ call_brief: brief, call_brief_generated_at: generatedAt })
      .eq("id", id);
    if (saveErr) console.error("Call brief save failed:", saveErr);
    return Response.json({ brief, generated_at: generatedAt });
  } catch (err) {
    if (err instanceof CallBriefError) return jsonError(err.message, 502);
    if (err instanceof Anthropic.RateLimitError) {
      return jsonError("Claude is rate limited. Try again in a minute.", 503);
    }
    console.error("Call brief failed:", err);
    return jsonError("Could not generate the brief.", 502);
  }
}
