import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { ResultsReportView } from "@/components/results/ResultsReportView";
import { hasM365ResponseData } from "@/lib/pdf/m365-detect";
import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
} from "@/lib/m365-gap-analysis";
import { calculateAssessmentResult } from "@/lib/scoring";
import {
  SAMPLE_DENTAL_COMPANY,
  SAMPLE_DENTAL_RESPONSES,
} from "@/lib/sample-report/dental-practice-fixture";
import type { Industry, EmployeeCountRange } from "@/types/assessment";

const SUBHEAD =
  "A free five-minute assessment for Oklahoma small and mid-sized businesses. Get your readiness score, a personalized ROI estimate, and a roadmap — delivered in a PDF you can share with your team.";

export const metadata: Metadata = {
  title: "Sample report",
  description: SUBHEAD,
  openGraph: {
    title: "Sample AI Readiness report | Tulsa AI Readiness Index",
    description: SUBHEAD,
  },
};

export default function SampleReportPage() {
  const responses = SAMPLE_DENTAL_RESPONSES;
  const result = calculateAssessmentResult(responses);
  const m365 = hasM365ResponseData(responses)
    ? analyzeM365SecurityGaps(
        buildM365GapAnalysisInput(
          responses,
          "dental" as Industry,
          "21-50" as EmployeeCountRange,
        ),
      )
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
          <ResultsReportView
            mode="sample"
            companyName={SAMPLE_DENTAL_COMPANY.companyName}
            contactLine={`${SAMPLE_DENTAL_COMPANY.city}, ${SAMPLE_DENTAL_COMPANY.state} · ${SAMPLE_DENTAL_COMPANY.contactName} · ${SAMPLE_DENTAL_COMPANY.roleTitle}`}
            scores={result.scores}
            tier={result.tier}
            recommendedNextStep={result.recommendedNextStep}
            roi={result.roi}
            insights={result.insights}
            m365={m365}
          />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
