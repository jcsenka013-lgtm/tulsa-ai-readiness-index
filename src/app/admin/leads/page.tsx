import Link from "next/link";
import { Suspense } from "react";

import { createServiceClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/lib/products/productConfig";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AdminProductFilter } from "./AdminProductFilter";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  email: string;
  company_name: string | null;
  full_name: string | null;
  status: string;
  source_product: string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{ product?: string }>;
};

function productLabel(p: string | null): string {
  if (p === "copilot_readiness") {
    return PRODUCTS.copilot_readiness.shortName;
  }
  return PRODUCTS.ai_readiness.shortName;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const { product: productFilter = "all" } = await searchParams;
  const supabase = createServiceClient();

  let q = supabase
    .from("leads")
    .select("id, email, company_name, full_name, status, source_product, created_at")
    .order("created_at", { ascending: false });

  if (productFilter === "ai_readiness" || productFilter === "copilot_readiness") {
    q = q.eq("source_product", productFilter);
  }

  const { data: leadRows, error } = await q;

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-destructive">Could not load leads: {error.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ensure migration 005 is applied and source_product exists on leads.
        </p>
      </div>
    );
  }

  const leads = (leadRows ?? []) as LeadRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by source product (mirrors the assessment the contact completed).
          </p>
        </div>
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Admin home
        </Link>
      </div>

      <Suspense fallback={<div className="h-10 max-w-sm animate-pulse rounded-md bg-muted" />}>
        <AdminProductFilter />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No leads match this filter.
                </td>
              </tr>
            ) : (
              leads.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{productLabel(row.source_product)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.email}</td>
                  <td className="px-3 py-2">{row.company_name ?? "—"}</td>
                  <td className="px-3 py-2">{row.full_name ?? "—"}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
