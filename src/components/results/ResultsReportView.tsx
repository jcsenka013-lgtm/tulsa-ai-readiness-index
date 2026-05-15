"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lightbulb, Minus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { getDiscoveryCalendlyWithUtm } from "@/lib/calendly-utm";
import { ResultsView } from "@/components/results/ResultsView";
import type { M365GapAnalysisReport } from "@/lib/m365-gap-analysis";
import { recommendedNextStepHeadline } from "@/lib/pdf/next-step-content";
import type { ROIEstimate } from "@/lib/scoring/calculateROI";
import type { Insight } from "@/lib/scoring/generateInsights";
import { cn } from "@/lib/utils";
import type {
  DomainScores,
  ProductType,
  ReadinessTier,
  RecommendedNextStep,
  ScoreBreakdown,
} from "@/types/assessment";

const DOMAIN_ROWS: { key: keyof DomainScores; label: string }[] = [
  { key: "dataSecurityCompliance", label: "Data security & compliance" },
  { key: "operationalProcessMaturity", label: "Operational process maturity" },
  { key: "technologyInfrastructure", label: "Technology infrastructure" },
  { key: "teamChangeManagement", label: "Team & change management" },
  { key: "financialStrategicAlignment", label: "Financial & strategic alignment" },
];

function tierLabel(t: string): string {
  const labels: Record<string, string> = {
    foundation: "Foundation",
    exploration: "Exploration",
    pilot: "Pilot",
    scale: "Scale",
  };
  return labels[t] ?? t;
}

function copilotNarrative(
  s: M365GapAnalysisReport["copilot_readiness_status"],
): string {
  switch (s) {
    case "blocked":
      return "Blocked — prerequisites not met for Copilot for Microsoft 365";
    case "possible_with_upgrades":
      return "Possible with licensing and/or configuration upgrades";
    case "ready_with_gaps":
      return "Mostly ready — close remaining gaps before broad rollout";
    case "ready":
      return "Ready — proceed with pilot planning and scoped rollout";
    default:
      return "Copilot readiness";
  }
}

function severityStyles(severity: Insight["severity"]): {
  icon: typeof CheckCircle2;
  className: string;
} {
  switch (severity) {
    case "strength":
      return { icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-500" };
    case "opportunity":
      return { icon: Lightbulb, className: "text-amber-600 dark:text-amber-500" };
    case "warning":
      return { icon: Minus, className: "text-amber-700 dark:text-amber-500" };
    case "critical":
      return { icon: AlertTriangle, className: "text-destructive" };
  }
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export type ResultsReportViewProps = {
  mode: "live" | "sample";
  companyName: string;
  contactLine?: string;
  scores: ScoreBreakdown;
  tier: ReadinessTier;
  recommendedNextStep: RecommendedNextStep;
  roi: ROIEstimate;
  insights: Insight[];
  m365: M365GapAnalysisReport | null;
  /** Live PDF — omit in sample */
  assessmentId?: string;
  /** Sample-mode primary CTA target (default `/assessment`) */
  sampleAssessmentHref?: string;
  /** Hide the default sample explainer ribbon (e.g. when the page has its own banner) */
  hideSampleCallout?: boolean;
  /** Product for PDF analytics + Calendly UTM (defaults to general AI Readiness) */
  productType?: ProductType;
  /** Optional override; otherwise Calendly discovery + product UTM is used */
  bookDiscoveryHref?: string;
  /** Cross-product promotional card (e.g. Copilot CTA on AI results) */
  crossProductSlot?: ReactNode;
};

export function ResultsReportView({
  mode,
  companyName,
  contactLine,
  scores,
  tier,
  recommendedNextStep,
  roi,
  insights,
  m365,
  assessmentId,
  sampleAssessmentHref = "/assessment",
  hideSampleCallout = false,
  productType = "ai_readiness",
  bookDiscoveryHref: bookDiscoveryHrefProp,
  crossProductSlot,
}: ResultsReportViewProps) {
  const overall = Math.round(scores.overall);
  const displayInsights = insights.slice(0, 8);
  const bookDiscoveryHref =
    bookDiscoveryHrefProp ??
    (assessmentId
      ? getDiscoveryCalendlyWithUtm(productType, "results_cta", { assessmentId })
      : undefined);
  return (
    <div className="space-y-8">
      {mode === "sample" && !hideSampleCallout ? (
        <p
          className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-center text-sm font-medium text-sky-900 dark:text-sky-100"
          role="status"
        >
          SAMPLE REPORT — This is what you&apos;ll receive after completing your
          free assessment
        </p>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your results
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "sample" ? (
            <>
              Prepared for <span className="font-medium text-foreground">{companyName}</span>
              {contactLine ? (
                <>
                  {" "}
                  · {contactLine}
                </>
              ) : null}
            </>
          ) : (
            <>Prepared for {companyName || "Your organization"}</>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-4xl font-semibold tabular-nums text-foreground">
              {overall}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={overall} className="w-full">
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
          <p className="text-sm text-muted-foreground">
            Tier:{" "}
            <span className="font-medium text-foreground">
              {tierLabel(tier)}
            </span>
            {" · "}
            Next step:{" "}
            <span className="text-foreground">
              {recommendedNextStepHeadline(recommendedNextStep)}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domain scores</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm" aria-label="Scores by domain">
            {DOMAIN_ROWS.map(({ key, label }) => (
              <li key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {Math.round(scores[key])}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ROI estimate (shows the math)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            First-year net savings (after investment):{" "}
            <span className="font-medium text-foreground">
              {formatUsd(roi.firstYearNetSavingsLow)} –{" "}
              {formatUsd(roi.firstYearNetSavingsHigh)}
            </span>
          </p>
          <p>
            Payback window:{" "}
            <span className="font-medium text-foreground">
              {roi.paybackMonthsLow}–{roi.paybackMonthsHigh} months
            </span>
          </p>
          <p>
            Suggested first-year investment range:{" "}
            <span className="font-medium text-foreground">
              {formatUsd(roi.recommendedInvestmentLow)} –{" "}
              {formatUsd(roi.recommendedInvestmentHigh)}
            </span>
          </p>
          <p className="text-xs">
            Model uses your industry, headcount, revenue band, and repetitive
            work hours. Figures are estimates — your PDF includes the same
            breakdown.
          </p>
        </CardContent>
      </Card>

      {displayInsights.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Insights &amp; recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {displayInsights.map((insight) => {
                const { icon: Icon, className: iconCl } = severityStyles(
                  insight.severity,
                );
                return (
                  <li
                    key={insight.id}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex gap-2">
                      <Icon
                        className={cn("mt-0.5 h-4 w-4 shrink-0", iconCl)}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {insight.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                        <p className="mt-2 text-sm text-foreground/90">
                          <span className="font-medium">Recommended: </span>
                          {insight.recommendedAction}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {crossProductSlot}

      {m365 ? (
        <Card>
          <CardHeader>
            <CardTitle>Microsoft 365 &amp; Copilot readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {m365.copilot_relevance?.status === "not_microsoft_365_tenant" ? (
              <p
                className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-foreground"
                role="status"
              >
                {m365.copilot_relevance.message}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {copilotNarrative(m365.copilot_readiness_status)} · License
              context:{" "}
              {m365.current_license_tier === "unknown"
                ? "Unknown / not specified"
                : m365.current_license_tier.replace(/_/g, " ")}
            </p>
            {m365.executive_summary_bullets.length > 0 ? (
              <ul className="list-inside list-disc text-muted-foreground">
                {m365.executive_summary_bullets.slice(0, 4).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            {m365.compliance_gaps.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Sample compliance gaps</p>
                <ul className="mt-2 space-y-2">
                  {m365.compliance_gaps.slice(0, 2).map((g) => (
                    <li
                      key={g.control}
                      className="rounded-md border border-border bg-muted/30 p-3"
                    >
                      <p className="font-medium text-foreground">{g.control}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Risk: {g.risk_level} · {g.current_state}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {m365.quick_wins.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Quick wins</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {m365.quick_wins.slice(0, 2).map((q) => (
                    <li key={q.title}>
                      <span className="text-foreground">{q.title}:</span>{" "}
                      {q.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {mode === "sample" ? (
              <p className="text-xs text-muted-foreground">
                Your full PDF report expands this with upgrade paths, Purview
                alignment, and a 90-day security roadmap.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {mode === "sample" || !assessmentId ? (
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-1">
            <Link
              href={sampleAssessmentHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex w-full justify-center sm:w-auto",
              )}
            >
              Start the free assessment
            </Link>
            {mode === "sample" ? (
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Complete the assessment to download your own PDF and
                personalized M365 roadmap.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
            <ResultsView assessmentId={assessmentId!} productType={productType} />
            {bookDiscoveryHref ? (
              <a
                href={bookDiscoveryHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg", variant: "default" }),
                  "inline-flex justify-center",
                )}
              >
                Book a discovery call
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
