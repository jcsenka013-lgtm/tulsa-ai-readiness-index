import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isCallBrief } from "@/lib/assistant/call-brief";
import { recommendedNextStepHeadline } from "@/lib/pdf/next-step-content";
import { TIER_DISPLAY } from "@/lib/pdf/tier-copy";
import { PRODUCTS } from "@/lib/products/productConfig";
import { createServiceClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { ProductType, ReadinessTier, RecommendedNextStep } from "@/types/assessment";

import { CallBriefPanel } from "./CallBriefPanel";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("assessments")
    .select(
      "id, status, product_type, full_name, email, phone, role_title, company_name, industry, employee_count_range, overall_score, readiness_tier, recommended_next_step, completed_at, booked_call_at, call_brief, call_brief_generated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-destructive">Could not load this lead: {error.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ensure migration 008 is applied (call_brief columns on assessments).
        </p>
      </div>
    );
  }
  if (!row) notFound();

  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
  const product = PRODUCTS[productType];
  const brief = isCallBrief(row.call_brief) ? row.call_brief : null;

  const facts: [string, string | null][] = [
    ["Name", row.full_name],
    ["Role", row.role_title],
    ["Email", row.email],
    ["Phone", row.phone],
    ["Industry", row.industry],
    ["Employees", row.employee_count_range],
    ["Overall score", row.overall_score === null ? null : String(row.overall_score)],
    ["Tier", row.readiness_tier ? TIER_DISPLAY[row.readiness_tier as ReadinessTier] : null],
    [
      "Next step",
      row.recommended_next_step
        ? recommendedNextStepHeadline(row.recommended_next_step as RecommendedNextStep)
        : null,
    ],
    ["Completed", row.completed_at ? new Date(row.completed_at).toLocaleString() : null],
    ["Call booked", row.booked_call_at ? new Date(row.booked_call_at).toLocaleString() : null],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{product.shortName}</p>
          <h1 className="text-2xl font-semibold">{row.company_name ?? "Unnamed company"}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={product.resultsPath(row.id)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Results page
          </Link>
          <Link href="/admin/leads" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            ← Leads
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-border p-6 text-sm sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 sm:block">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      {row.status === "completed" ? (
        <CallBriefPanel
          assessmentId={row.id}
          initialBrief={brief}
          initialGeneratedAt={brief ? row.call_brief_generated_at : null}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          This assessment isn&apos;t complete yet, so there&apos;s no brief to write.
        </p>
      )}
    </div>
  );
}
