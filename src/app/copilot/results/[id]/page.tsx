"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ResultsReportView } from "@/components/results/ResultsReportView";
import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";
import { shouldShowAiReadinessCrossSell } from "@/lib/cross-product/promo";
import { mergeResponsesWithFirmographics } from "@/lib/assessment/merge-responses";
import { setSentryProductTypeTag } from "@/lib/monitoring/sentry-product";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import { buildM365GapAnalysisInput, analyzeM365SecurityGaps } from "@/lib/m365-gap-analysis";
import { calculateAssessmentResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { EmployeeCountRange, Industry } from "@/types/assessment";

type Row = {
  id: string;
  status: string;
  product_type?: string | null;
  company_name: string | null;
  responses: unknown;
  industry: string | null;
  employee_count_range: string | null;
};

export default function CopilotResultsIdPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [row, setRow] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const bookedPing = useRef(false);

  useEffect(() => {
    setSentryProductTypeTag("copilot_readiness");
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
      if (data.product_type === "ai_readiness") {
        router.replace(`/results/${id}`);
        return;
      }
      setRow(data);
    })();
  }, [id, router]);

  useEffect(() => {
    if (!id || !row || row.status !== "completed") return;
    trackFunnel(FUNNEL.resultsViewed, "copilot_readiness", { assessment_id: id });
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
        trackFunnel(FUNNEL.discoveryCallBooked, "copilot_readiness", { assessment_id: id });
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
          href={`/copilot/assessment/${id}`}
          className={cn(buttonVariants(), "mt-4 inline-flex")}
        >
          Continue assessment
        </Link>
      </div>
    );
  }

  const { result, m365 } = engine;

  const notM365Banner = shouldShowAiReadinessCrossSell({
    productType: "copilot_readiness",
    copilotRelevanceStatus: m365?.copilot_relevance?.status ?? null,
  }) ? (
      <div
        className="rounded-lg border border-blue-200/80 bg-blue-50/60 px-4 py-3 text-sm text-slate-800"
        role="status"
      >
        <p className="font-medium">This product isn&apos;t quite right for you.</p>
        <p className="mt-1 text-muted-foreground">
          The Copilot path assumes a Microsoft 365 tenant. For a broader read that matches your
          stack, try the general AI Readiness Index instead.
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex font-medium text-blue-700 underline-offset-4 hover:underline"
        >
          Go to the AI Readiness Index
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
        productType="copilot_readiness"
        crossProductSlot={notM365Banner}
      />
    </div>
  );
}
