"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ResultsReportView } from "@/components/results/ResultsReportView";
import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";
import { shouldShowCopilotCrossSell } from "@/lib/cross-product/promo";
import { mergeResponsesWithFirmographics } from "@/lib/assessment/merge-responses";
import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import { buildM365GapAnalysisInput, analyzeM365SecurityGaps } from "@/lib/m365-gap-analysis";
import { calculateAssessmentResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { AssessmentResponse, EmployeeCountRange, Industry, ProductType } from "@/types/assessment";

type Row = {
  id: string;
  status: string;
  product_type?: string | null;
  company_name: string | null;
  responses: unknown;
  industry: string | null;
  employee_count_range: string | null;
};

export default function ResultsIdPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [row, setRow] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const bookedPing = useRef(false);

  useEffect(() => {
    setSentryProductTypeTag("ai_readiness");
  }, []);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const res = await fetch(`/api/assessment/${id}`);
      if (res.status === 404) {
        setErr("Result not found.");
        return;
      }
      if (!res.ok) {
        setErr("Could not load results.");
        return;
      }
      const data = (await res.json()) as Row;
      if (data.product_type === "copilot_readiness") {
        router.replace(`/copilot/results/${id}`);
        return;
      }
      setRow(data);
    })();
  }, [id, router]);

  useEffect(() => {
    if (!id || !row || row.status !== "completed") return;
    trackFunnel(FUNNEL.resultsViewed, "ai_readiness", { assessment_id: id });
  }, [id, row]);

  useEffect(() => {
    if (
      !id ||
      !row ||
      row.status !== "completed" ||
      searchParams.get("calendly_booked") !== "1" ||
      bookedPing.current
    ) {
      return;
    }
    bookedPing.current = true;
    void (async () => {
      const res = await fetch(`/api/assessment/${id}/booked`, { method: "POST" });
      if (res.ok) {
        trackFunnel(FUNNEL.discoveryCallBooked, "ai_readiness", { assessment_id: id });
      }
      const next = new URLSearchParams(searchParams.toString());
      next.delete("calendly_booked");
      const q = next.toString();
      router.replace(q ? `${window.location.pathname}?${q}` : window.location.pathname, {
        scroll: false,
      });
    })();
  }, [id, row, searchParams, router]);

  const engine = useMemo(() => {
    if (!row) return null;
    const merged = mergeResponsesWithFirmographics(row as Record<string, unknown>);
    const result = calculateAssessmentResult(merged);
    const m365 =
      hasM365ResponseData(merged) && row.industry && row.employee_count_range
        ? analyzeM365SecurityGaps(
            buildM365GapAnalysisInput(
              merged,
              row.industry as Industry,
              row.employee_count_range as EmployeeCountRange,
            ),
          )
        : null;
    return { merged, result, m365 };
  }, [row]);

  if (!id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-destructive">
        Missing result id.
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-destructive">
        {err}
      </div>
    );
  }

  if (!row || !engine) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
        Loading results…
      </div>
    );
  }

  if (row.status !== "completed") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">This assessment is not complete yet.</p>
        <Link
          href={`/assessment/${id}`}
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          Continue assessment
        </Link>
      </div>
    );
  }

  const { merged, result, m365 } = engine;
  const productType: ProductType =
    row.product_type === "copilot_readiness" ? "copilot_readiness" : "ai_readiness";

  const copilotCross =
    shouldShowCopilotCrossSell({
      productType,
      scores: result.scores,
      responses: merged as AssessmentResponse,
    }) ? (
      <div
        className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-foreground"
        role="status"
      >
        <p className="font-medium">Your M365 posture came up in this assessment.</p>
        <p className="mt-1 text-muted-foreground">
          Want a deeper look specific to Copilot? Take the Copilot Readiness Assessment.
        </p>
        <Link
          href="/copilot"
          className="mt-3 inline-flex font-medium text-foreground underline-offset-4 hover:underline"
        >
          Copilot Readiness Assessment
        </Link>
      </div>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <ResultsReportView
        mode="live"
        companyName={row.company_name ?? "Your organization"}
        scores={result.scores}
        tier={result.tier}
        recommendedNextStep={result.recommendedNextStep}
        roi={result.roi}
        insights={result.insights}
        m365={m365}
        assessmentId={id}
        productType="ai_readiness"
        crossProductSlot={copilotCross}
      />
    </div>
  );
}
