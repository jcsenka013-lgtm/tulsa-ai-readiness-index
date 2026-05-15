"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { PRODUCTS } from "@/lib/products/productConfig";

const OPTIONS = [
  { value: "all", label: "All products" },
  { value: "ai_readiness", label: PRODUCTS.ai_readiness.shortName },
  { value: "copilot_readiness", label: PRODUCTS.copilot_readiness.shortName },
] as const;

export function AdminProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("product") ?? "all";

  const onChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("product");
      } else {
        params.set("product", value);
      }
      const q = params.toString();
      router.push(q ? `/admin/leads?${q}` : "/admin/leads");
    },
    [router, searchParams],
  );

  return (
    <div className="max-w-sm space-y-1">
      <label htmlFor="admin-product" className="text-sm font-medium text-foreground">
        Product
      </label>
      <select
        id="admin-product"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={current}
        onChange={(e) => onChange(e.target.value)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
