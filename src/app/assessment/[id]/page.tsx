"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  AssessmentForm,
  type ApiAssessmentRow,
} from "@/components/assessment/AssessmentForm";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { ProductType } from "@/types/assessment";

export default function AssessmentIdPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [row, setRow] = useState<ApiAssessmentRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/assessment/${id}`);
      if (cancelled) return;
      if (res.status === 404) {
        setError("We could not find that assessment. Start a new one from the home page.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong loading your assessment.");
        return;
      }
      const data = (await res.json()) as ApiAssessmentRow & { status: string };
      if (data.status === "completed") {
        const pt =
          data.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";
        router.replace(PRODUCTS[pt].resultsPath(id!));
        return;
      }
      setRow(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-destructive">
        Missing assessment id.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
        Loading your assessment…
      </div>
    );
  }

  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";

  return (
    <AssessmentForm
      assessmentId={id}
      initialRow={row}
      productType={productType}
    />
  );
}
