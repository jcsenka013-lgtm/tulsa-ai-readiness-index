import Anthropic from "@anthropic-ai/sdk";

import { isValidTranscript, runAssistant } from "@/lib/assistant/agent";
import { buildAssistantContext } from "@/lib/assistant/tools";
import { checkAssistantLimit } from "@/lib/rate-limit/assistant";
import { getClientIpFromRequest } from "@/lib/rate-limit/assessment-create";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("Assistant is not configured", 503);
  }

  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!isValidTranscript(body.messages)) {
    return jsonError("Invalid messages", 400);
  }

  const limit = checkAssistantLimit(getClientIpFromRequest(request), id);
  if (!limit.allowed) {
    return jsonError("Too many questions for now. Try again later.", 429, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("assessments")
    .select(
      "id, status, product_type, company_name, industry, employee_count_range, annual_revenue_range, responses",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonError(`Failed to load assessment: ${error.message}`, 500);
  }
  if (!row) {
    return jsonError("Assessment not found", 404);
  }
  if (row.status !== "completed") {
    return jsonError("Assessment is not complete", 409);
  }

  try {
    const reply = await runAssistant(buildAssistantContext(row), body.messages);
    return Response.json({ reply: reply.text, tools_used: reply.toolsUsed });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return jsonError("The assistant is busy. Try again in a minute.", 503);
    }
    console.error("Results assistant failed:", err);
    return jsonError("The assistant is unavailable right now.", 502);
  }
}
