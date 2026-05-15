import type { Metadata } from "next";
import Link from "next/link";

import { CopilotTrackLink } from "@/app/copilot/CopilotTrackLink";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ResultsReportView } from "@/components/results/ResultsReportView";
import { buttonVariants } from "@/components/ui/button";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
} from "@/lib/m365-gap-analysis";
import { calculateAssessmentResult } from "@/lib/scoring";
import {
  SAMPLE_COPILOT_INSURANCE_COMPANY,
  SAMPLE_COPILOT_INSURANCE_RESPONSES,
} from "@/lib/sample-report/copilot-insurance-fixture";
import type { EmployeeCountRange, Industry } from "@/types/assessment";
import { cn } from "@/lib/utils";

import { CopilotSampleReportAnalytics } from "./CopilotSampleReportAnalytics";

const DESCRIPTION =
  "Full sample Copilot Readiness report: mid-sized insurance agency, exploration tier, seats purchased before the M365 foundation was ready — same engine as live assessments.";

export const metadata: Metadata = {
  title: "Sample Copilot Readiness report",
  description: DESCRIPTION,
  openGraph: {
    title: "Sample Copilot Readiness report | Tulsa Applied AI",
    description: DESCRIPTION,
    url: "/copilot/sample-report",
    images: [{ url: "/og-copilot.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sample Copilot Readiness report | Tulsa Applied AI",
    description: DESCRIPTION,
    images: ["/og-copilot.png"],
  },
};

export default function CopilotSampleReportPage() {
  const responses = SAMPLE_COPILOT_INSURANCE_RESPONSES;
  const result = calculateAssessmentResult(responses);
  const m365 = hasM365ResponseData(responses)
    ? analyzeM365SecurityGaps(
        buildM365GapAnalysisInput(
          responses,
          "insurance" as Industry,
          "21-50" as EmployeeCountRange,
        ),
      )
    : null;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <CopilotSampleReportAnalytics />
      <header className="border-b border-blue-100/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/copilot" className="text-sm font-semibold text-slate-900 hover:text-blue-700">
            Tulsa Applied AI — Copilot
          </Link>
          <CopilotTrackLink
            href="/copilot/assessment"
            eventName="copilot_assessment_started"
            eventProps={{ source: "sample_report" }}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            Start assessment
          </CopilotTrackLink>
        </div>
      </header>

      <main className="flex-1">
        <div
          className="bg-blue-600 px-4 py-3 text-center text-sm font-semibold tracking-wide text-white"
          role="status"
        >
          SAMPLE REPORT — Illustrative Copilot Readiness results (insurance agency, exploration
          tier)
        </div>
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
          <ResultsReportView
            mode="sample"
            companyName={SAMPLE_COPILOT_INSURANCE_COMPANY.companyName}
            contactLine={`${SAMPLE_COPILOT_INSURANCE_COMPANY.city}, ${SAMPLE_COPILOT_INSURANCE_COMPANY.state} · ${SAMPLE_COPILOT_INSURANCE_COMPANY.contactName} · ${SAMPLE_COPILOT_INSURANCE_COMPANY.roleTitle}`}
            scores={result.scores}
            tier={result.tier}
            recommendedNextStep={result.recommendedNextStep}
            roi={result.roi}
            insights={result.insights}
            m365={m365}
            sampleAssessmentHref="/copilot/assessment"
            hideSampleCallout
          />
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-8">
            <CopilotTrackLink
              href="/copilot/assessment"
              eventName="copilot_assessment_started"
              eventProps={{ source: "sample_report" }}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto",
              )}
            >
              Get your own report — start the assessment
            </CopilotTrackLink>
            <Link href="/copilot" className="text-sm text-blue-700 underline-offset-4 hover:underline">
              Back to Copilot overview
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter
        crossPromo={{ href: "/", label: "General AI Readiness Index" }}
      />
    </div>
  );
}
