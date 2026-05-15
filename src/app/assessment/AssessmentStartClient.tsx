"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { ProductType } from "@/types/assessment";

export function AssessmentStartClient({
  productType = "ai_readiness",
}: {
  productType?: ProductType;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const utm_source = searchParams.get("utm_source") ?? undefined;
    const utm_medium = searchParams.get("utm_medium") ?? undefined;
    const utm_campaign = searchParams.get("utm_campaign") ?? undefined;

    void (async () => {
      const res = await fetch("/api/assessment/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          utm_source,
          utm_medium,
          utm_campaign,
          product_type: productType,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = j.error ?? "Could not start the assessment.";
        setError(msg);
        toast.error(msg);
        return;
      }
      const j = (await res.json()) as { id: string };
      trackFunnel(FUNNEL.assessmentStarted, productType, { assessment_id: j.id });
      const base = PRODUCTS[productType].assessmentPath;
      router.replace(`${base}/${j.id}`);
    })();
  }, [router, searchParams, productType]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">Please refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
      <p>Starting your assessment…</p>
    </div>
  );
}
