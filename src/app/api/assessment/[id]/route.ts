import { createServiceClient } from "@/lib/supabase/server";
import type { AssessmentResponse } from "@/types/assessment";

export const dynamic = "force-dynamic";

const CONTACT_FIELDS = ["email", "phone", "full_name", "role_title"] as const;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonError(`Failed to load assessment: ${error.message}`, 500);
  }
  if (!data) {
    return jsonError("Assessment not found", 404);
  }

  // Completed results are shareable by link, so drop the lead's contact details.
  if (data.status === "completed") {
    const publicRow: Record<string, unknown> = { ...data };
    for (const key of CONTACT_FIELDS) delete publicRow[key];
    return Response.json(publicRow);
  }

  return Response.json(data);
}

type PatchBody = {
  responses?: Record<string, unknown>;
  industry?: string | null;
  employee_count_range?: string | null;
  annual_revenue_range?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  role_title?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return jsonError("Missing assessment id", 400);
  }

  const supabase = createServiceClient();
  const { data: row, error: loadErr } = await supabase
    .from("assessments")
    .select("id, status, responses")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    return jsonError(`Failed to load assessment: ${loadErr.message}`, 500);
  }
  if (!row) {
    return jsonError("Assessment not found", 404);
  }

  if (row.status !== "in_progress") {
    return jsonError("Assessment is not editable", 409);
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const existing = (row.responses ?? {}) as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (body.responses !== undefined) {
    update.responses = {
      ...existing,
      ...body.responses,
    } as AssessmentResponse;
  }
  if (body.industry !== undefined) {
    update.industry = body.industry;
  }
  if (body.employee_count_range !== undefined) {
    update.employee_count_range = body.employee_count_range;
  }
  if (body.annual_revenue_range !== undefined) {
    update.annual_revenue_range = body.annual_revenue_range;
  }
  if (body.full_name !== undefined) {
    update.full_name = body.full_name;
  }
  if (body.email !== undefined) {
    update.email = body.email;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone;
  }
  if (body.company_name !== undefined) {
    update.company_name = body.company_name;
  }
  if (body.role_title !== undefined) {
    update.role_title = body.role_title;
  }

  if (Object.keys(update).length === 0) {
    return jsonError("No valid fields in body", 400);
  }

  const { error: upErr } = await supabase
    .from("assessments")
    .update(update)
    .eq("id", id)
    .eq("status", "in_progress");

  if (upErr) {
    return jsonError(`Failed to update: ${upErr.message}`, 500);
  }

  return Response.json({ updated_at: new Date().toISOString() });
}
