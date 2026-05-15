import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeM365SecurityGaps,
  buildM365GapAnalysisInput,
} from "../src/lib/m365-gap-analysis";
import { hasM365ResponseData } from "../src/lib/pdf/m365-detect";
import { generateReportPDF } from "../src/lib/pdf/generatePDF";
import { calculateAssessmentResult } from "../src/lib/scoring";
import { MEDIUM_RESPONSES } from "../src/lib/scoring/__tests__/fixtures";
import type { Assessment } from "../src/types/assessment";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

async function main(): Promise<void> {
  const responses = {
    ...MEDIUM_RESPONSES,
    m365_license_tier: "business_premium",
    m365_entra_plan: "p1",
    m365_exchange_online: "yes",
    m365_onedrive: "yes",
    m365_sensitivity_labels: "pilot",
    m365_copilot_add_on: "no",
    m365_dlp: "standard",
    m365_audit_retention: "90_days",
  };

  const result = calculateAssessmentResult(responses);
  const industry = "dental";
  const employeeCountRange = "21-50" as const;

  const m365Analysis = hasM365ResponseData(responses)
    ? analyzeM365SecurityGaps(
        buildM365GapAnalysisInput(
          responses,
          industry,
          employeeCountRange,
        ),
      )
    : null;

  const assessment: Assessment = {
    id: "00000000-0000-4000-8000-000000000001",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    productType: "ai_readiness",
    status: "completed",
    email: "sample@example.com",
    fullName: "Sample User",
    companyName: "Sample Dental Practice — Very Long Legal Name PLLC",
    roleTitle: "Owner",
    phone: null,
    industry,
    employeeCountRange,
    annualRevenueRange: "1m_5m",
    responses,
    dataSecurityComplianceScore: result.scores.dataSecurityCompliance,
    operationalProcessMaturityScore: result.scores.operationalProcessMaturity,
    technologyInfrastructureScore: result.scores.technologyInfrastructure,
    teamChangeManagementScore: result.scores.teamChangeManagement,
    financialStrategicAlignmentScore: result.scores.financialStrategicAlignment,
    overallScore: result.scores.overall,
    readinessTier: result.tier,
    estimatedAnnualSavings: null,
    estimatedPaybackMonths: null,
    recommendedNextStep: result.recommendedNextStep,
    pdfUrl: null,
    pdfDownloadCount: 0,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    bookedCallAt: null,
  };

  const buf = await generateReportPDF({
    assessment,
    scores: result.scores,
    tier: result.tier,
    recommendedNextStep: result.recommendedNextStep,
    roi: result.roi,
    insights: result.insights,
    m365Analysis,
  });

  const outDir = path.join(ROOT, "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "sample-report.pdf");
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${(buf.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
