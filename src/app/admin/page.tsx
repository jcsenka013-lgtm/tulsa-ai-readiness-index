import Link from "next/link";

import { createServiceClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/lib/products/productConfig";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function startOfWeekUtc(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = createServiceClient();
  const since = startOfWeekUtc();

  const { data: weekRows, error } = await supabase
    .from("leads")
    .select("source_product")
    .gte("created_at", since);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-destructive">Could not load stats: {error.message}</p>
      </div>
    );
  }

  const counts: Record<string, number> = {};
  for (const row of weekRows ?? []) {
    const key = (row as { source_product: string | null }).source_product ?? "ai_readiness";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const ai = counts["ai_readiness"] ?? 0;
  const cop = counts["copilot_readiness"] ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal dashboard — protect this route in production (auth / allowlist).
        </p>
      </div>
      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground">Leads this week (UTC)</h2>
        <p className="mt-3 text-base">
          {PRODUCTS.ai_readiness.shortName}: {ai} leads this week
          <span className="text-muted-foreground"> · </span>
          {PRODUCTS.copilot_readiness.shortName}: {cop} leads this week
        </p>
      </section>
      <div>
        <Link
          href="/admin/leads"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          View all leads
        </Link>
      </div>
    </div>
  );
}
