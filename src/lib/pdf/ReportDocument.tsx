/**
 * Tulsa AI Readiness Index — branded PDF report (@react-pdf/renderer).
 */

import type { ReactNode } from "react";
import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { DOMAINS } from "@/lib/questions/bank";
import type { DomainId } from "@/lib/questions/types";
import type { M365GapAnalysisReport } from "@/lib/m365-gap-analysis";
import type { Insight, InsightSeverity } from "@/lib/scoring/generateInsights";
import type {
  Assessment,
  ReadinessTier,
  RecommendedNextStep,
  ScoreBreakdown,
} from "@/types/assessment";
import type { ROIEstimate } from "@/lib/scoring/calculateROI";

import { topAutomationOpportunities } from "@/lib/pdf/automation-opportunities";
import {
  formatEmployeeRange,
  formatHoursBucket,
  formatIndustry,
  formatPaybackRange,
  formatReportDate,
  formatUsd,
  formatUsdRange,
  truncateForPdf,
} from "@/lib/pdf/formatters";
import {
  nextStepEngagementDetail,
  recommendedNextStepHeadline,
  recommendedNextStepShortCallout,
} from "@/lib/pdf/next-step-content";
import {
  splitInsightsAcrossTwoPages,
  topInsightsForExecutiveSummary,
} from "@/lib/pdf/insight-helpers";
import { TIER_BAR_COLOR, TIER_DISPLAY, tierHeroParagraph } from "@/lib/pdf/tier-copy";

const MARGIN = 54; // 0.75 inch @ 72 dpi
const BODY = 10.5;
const H2 = 18;
const H3 = 14;

const DOMAIN_SCORE_KEY: Record<DomainId, keyof ScoreBreakdown> = {
  data_security_compliance: "dataSecurityCompliance",
  operational_process_maturity: "operationalProcessMaturity",
  technology_infrastructure: "technologyInfrastructure",
  team_change_management: "teamChangeManagement",
  financial_strategic_alignment: "financialStrategicAlignment",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN + 18,
    paddingHorizontal: MARGIN,
    fontFamily: "Helvetica",
    fontSize: BODY,
    color: "#111827",
  },
  cover: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: MARGIN,
    fontFamily: "Helvetica",
  },
  wordmark: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 5,
    marginBottom: 48,
    textAlign: "center",
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#374151",
    marginBottom: 8,
    maxWidth: 420,
  },
  coverMeta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 24,
    textAlign: "center",
  },
  coverOrg: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 40,
    textAlign: "center",
  },
  header: {
    position: "absolute",
    top: 28,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6b7280",
  },
  h2: {
    fontSize: H2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    color: "#0f172a",
  },
  h3: {
    fontSize: H3,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#1e293b",
  },
  body: {
    fontSize: BODY,
    lineHeight: 1.45,
    marginBottom: 8,
  },
  callout: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  calloutTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
  barTrack: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 10,
    width: "100%",
  },
  barFill: {
    height: 10,
    borderRadius: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    paddingBottom: 4,
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    fontSize: 8,
    lineHeight: 1.35,
  },
  footerNote: {
    position: "absolute",
    bottom: 28,
    left: MARGIN,
    right: MARGIN,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
});

function severityBadgeStyle(sev: InsightSeverity): { bg: string; fg: string } {
  switch (sev) {
    case "critical":
      return { bg: "#fee2e2", fg: "#991b1b" };
    case "warning":
      return { bg: "#ffedd5", fg: "#9a3412" };
    case "opportunity":
      return { bg: "#dbeafe", fg: "#1e40af" };
    case "strength":
      return { bg: "#dcfce7", fg: "#166534" };
  }
}

function domainInterpretation(score: number): string {
  if (score < 40) {
    return "This dimension is a drag on safe AI adoption — expect rework if you skip it.";
  }
  if (score < 70) {
    return "Solid progress possible here with focused work over the next quarter.";
  }
  return "This dimension is a relative strength — leverage it when sequencing pilots.";
}

function copilotStatusLabel(status: M365GapAnalysisReport["copilot_readiness_status"]): string {
  switch (status) {
    case "blocked":
      return "Blocked — prerequisites not met for Copilot for Microsoft 365";
    case "possible_with_upgrades":
      return "Possible with licensing and/or configuration upgrades";
    case "ready_with_gaps":
      return "Mostly ready — close remaining gaps before broad rollout";
    case "ready":
      return "Ready — proceed with pilot planning and scoped rollout";
  }
}

function riskLabel(level: string): string {
  return level.replace(/_/g, " ").toUpperCase();
}

function effortLabel(e: string): string {
  return e.charAt(0).toUpperCase() + e.slice(1);
}

function PageChrome({
  companyName,
  children,
}: {
  companyName: string;
  children: ReactNode;
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header} fixed>
        <Text style={{ maxWidth: 380 }}>
          Prepared for {truncateForPdf(companyName, 48)}
        </Text>
        <Text
          render={({ pageNumber }) =>
            pageNumber > 1 ? `Page ${pageNumber}` : ""
          }
        />
      </View>
      {children}
    </Page>
  );
}

export interface ReportDocumentProps {
  assessment: Assessment;
  scores: ScoreBreakdown;
  tier: ReadinessTier;
  recommendedNextStep: RecommendedNextStep;
  roi: ROIEstimate;
  insights: Insight[];
  m365Analysis: M365GapAnalysisReport | null;
  calendlyUrl: string;
  contactEmail: string;
  contactPhone: string;
}

export function ReportDocument({
  assessment,
  scores,
  tier,
  recommendedNextStep,
  roi,
  insights,
  m365Analysis,
  calendlyUrl,
  contactEmail,
  contactPhone,
}: ReportDocumentProps) {
  const company =
    (assessment.companyName && assessment.companyName.trim()) ||
    "Your organization";
  const completed = formatReportDate(assessment.completedAt);
  const tierColor = TIER_BAR_COLOR[tier];
  const top3 = topInsightsForExecutiveSummary(insights);
  const [insP1, insP2] = splitInsightsAcrossTwoPages(insights);
  const autoOps = topAutomationOpportunities(assessment.responses, 3);
  const nextDetail = nextStepEngagementDetail(recommendedNextStep);

  const hoursLabel = formatHoursBucket(
    roi.inputsUsed.hoursPerWeekRange,
    roi.inputsUsed.hoursPerWeekDefaulted,
  );

  return (
    <Document
      author="Tulsa Applied AI LLC"
      title={`AI Readiness — ${company}`}
      subject="Tulsa AI Readiness Index"
    >
      {/* Cover */}
      <Page size="LETTER" style={styles.cover}>
        <Text style={styles.wordmark}>TULSA APPLIED AI</Text>
        <Text style={styles.coverTitle}>AI Readiness Assessment</Text>
        <Text style={styles.coverSubtitle}>
          Prepared for {truncateForPdf(company, 56)}
        </Text>
        <Text style={styles.coverMeta}>{completed}</Text>
        <Text style={styles.coverOrg}>Tulsa Applied AI LLC</Text>
        <Text
          style={styles.footerNote}
          fixed
        >
          Tulsa AI Readiness Index — confidential advisory summary
        </Text>
      </Page>

      {/* Executive summary */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>Executive summary</Text>
          <View style={styles.rowBetween}>
            <View style={{ width: "62%" }}>
              <Text style={styles.body}>{tierHeroParagraph(tier)}</Text>
            </View>
            <View style={{ width: "34%", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 36,
                  fontFamily: "Helvetica-Bold",
                  color: tierColor,
                }}
              >
                {scores.overall}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>
                {TIER_DISPLAY[tier]}
              </Text>
              <View style={{ width: "100%", marginTop: 8 }}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, Math.max(0, scores.overall))}%`,
                        backgroundColor: tierColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.h3}>Top insights</Text>
          {top3.map((i) => {
            const b = severityBadgeStyle(i.severity);
            return (
              <View key={i.id} style={{ marginBottom: 8 }} wrap={false}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={[styles.badge, { backgroundColor: b.bg, color: b.fg }]}>
                    <Text style={{ color: b.fg, fontSize: 7 }}>{i.severity}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                      {i.title}
                    </Text>
                    <Text style={{ fontSize: 9, color: "#374151", marginTop: 2 }}>
                      {truncateForPdf(i.description, 420)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Your recommended next step</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.45 }}>
              {recommendedNextStepShortCallout(recommendedNextStep)}
            </Text>
          </View>
        </View>
      </PageChrome>

      {/* Five dimensions */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>The five dimensions</Text>
          <Text style={styles.body}>
            {
              "AI readiness isn't one thing — it's five. Here's how your business measures up across each dimension that determines whether AI investments will pay off."
            }
          </Text>
          {DOMAINS.map((d) => {
            const key = DOMAIN_SCORE_KEY[d.id];
            const score = scores[key] as number;
            return (
              <View key={d.id} style={{ marginBottom: 10 }} wrap={false}>
                <View style={styles.rowBetween}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, maxWidth: 360 }}>
                    {d.name}
                  </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>{score}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, Math.max(0, score))}%`,
                        backgroundColor: tierColor,
                      },
                    ]}
                  />
                </View>
                <Text style={{ fontSize: 9, color: "#374151" }}>
                  At {score}/100 on {d.name}, {domainInterpretation(score)}
                </Text>
              </View>
            );
          })}
        </View>
      </PageChrome>

      {/* ROI — page 1 */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>ROI analysis</Text>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>
            {formatUsdRange(roi.automationPotentialLow, roi.automationPotentialHigh)}
          </Text>
          <Text style={{ fontSize: 10, color: "#475569", marginBottom: 10 }}>
            Estimated annual automation opportunity range (labor redirected from
            repetitive work)
          </Text>

          <Text style={styles.h3}>Inputs used (transparency)</Text>
          <Text style={styles.body}>
            • Industry: {formatIndustry(roi.inputsUsed.industry)}
            {roi.inputsUsed.industryDefaulted ? " (defaulted — not specified)" : ""}
            {"\n"}• Employees:{" "}
            {formatEmployeeRange(
              roi.inputsUsed.employeeCountRange,
              roi.inputsUsed.avgEmployeeCount,
            )}
            {"\n"}• Repetitive work: {hoursLabel}
            {"\n"}• Loaded hourly rate (benchmark): {formatUsd(roi.inputsUsed.loadedHourlyCost)}
            /hr — Tulsa-area SMB blended cost (wage + benefits + overhead)
          </Text>

          <Text style={styles.h3}>Calculation walkthrough</Text>
          <Text style={styles.body}>
            1) annualLaborCost = hours/week midpoint × 52 × loaded rate ={" "}
            {formatUsd(roi.annualLaborCost)}
            {"\n"}
            2) automationPotential = 40%–65% of annualLaborCost ={" "}
            {formatUsdRange(roi.automationPotentialLow, roi.automationPotentialHigh)}
            {"\n"}
            3) recommendedInvestment (tier-driven) ={" "}
            {formatUsdRange(roi.recommendedInvestmentLow, roi.recommendedInvestmentHigh)}
            {"\n"}
            4) paybackMonths = investment ÷ (annual savings ÷ 12) →{" "}
            {formatPaybackRange(roi.paybackMonthsLow, roi.paybackMonthsHigh)}
            {"\n"}
            5) firstYearNetSavings = savings − investment ={" "}
            {formatUsdRange(roi.firstYearNetSavingsLow, roi.firstYearNetSavingsHigh)}
          </Text>
        </View>
      </PageChrome>

      {/* ROI — page 2 */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h3}>Top automation opportunities</Text>
          {autoOps.length === 0 ? (
            <Text style={styles.body}>
              No specific repetitive processes were selected — opportunity list will
              refine during discovery.
            </Text>
          ) : (
            autoOps.map((o, idx) => (
              <Text key={o} style={styles.body}>
                {idx + 1}. {o}
              </Text>
            ))
          )}

          <View style={styles.callout}>
            <Text style={{ fontSize: 9, lineHeight: 1.45, color: "#334155" }}>
              These estimates are benchmarks based on your responses and typical
              results for similar businesses. Actual results vary based on
              implementation quality, team adoption, and organizational factors.
            </Text>
          </View>
        </View>
      </PageChrome>

      {/* M365 — conditional */}
      {m365Analysis ? (
        <>
          <PageChrome companyName={company}>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.h2}>Microsoft 365 readiness</Text>
              <Text style={{ ...styles.body, fontFamily: "Helvetica-Bold" }}>
                Copilot readiness: {copilotStatusLabel(m365Analysis.copilot_readiness_status)}
              </Text>
              <Text style={styles.h3}>Executive bullets</Text>
              {m365Analysis.executive_summary_bullets.map((b) => (
                <Text key={b} style={styles.body}>
                  • {b}
                </Text>
              ))}
              <Text style={styles.h3}>Prerequisites checklist</Text>
              {m365Analysis.copilot_prerequisites_status.slice(0, 5).map((r) => (
                <Text key={r.requirement} style={{ fontSize: 8, marginBottom: 4 }}>
                  • [{r.status}] {truncateForPdf(r.requirement, 90)}
                </Text>
              ))}
              {m365Analysis.copilot_prerequisites_status.length > 5 ? (
                <Text style={{ fontSize: 8, color: "#64748b" }}>
                  …plus {m365Analysis.copilot_prerequisites_status.length - 5} more rows
                  in the online report.
                </Text>
              ) : null}

              <Text style={styles.h3}>Compliance gaps</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "22%" }}>Gap</Text>
                <Text style={{ width: "12%" }}>Severity</Text>
                <Text style={{ width: "40%" }}>Admin path</Text>
                <Text style={{ width: "14%" }}>Effort</Text>
              </View>
              {m365Analysis.compliance_gaps.slice(0, 4).map((g) => (
                <View key={g.control} style={styles.tableRow} wrap={false}>
                  <Text style={{ width: "22%", fontFamily: "Helvetica-Bold" }}>
                    {truncateForPdf(g.control, 40)}
                  </Text>
                  <Text style={{ width: "12%" }}>{riskLabel(g.risk_level)}</Text>
                  <Text style={{ width: "40%" }}>
                    {truncateForPdf(g.remediation.admin_center_path, 160)}
                  </Text>
                  <Text style={{ width: "14%" }}>{effortLabel(g.remediation.effort)}</Text>
                </View>
              ))}
            </View>
          </PageChrome>

          <PageChrome companyName={company}>
            <View style={{ marginTop: 14 }}>
              {m365Analysis.compliance_gaps.length > 4 ? (
                <>
                  <Text style={styles.h3}>Compliance gaps (continued)</Text>
                  {m365Analysis.compliance_gaps.slice(4).map((g) => (
                    <View key={g.control} style={styles.tableRow} wrap={false}>
                      <Text style={{ width: "22%", fontFamily: "Helvetica-Bold" }}>
                        {truncateForPdf(g.control, 40)}
                      </Text>
                      <Text style={{ width: "12%" }}>{riskLabel(g.risk_level)}</Text>
                      <Text style={{ width: "40%" }}>
                        {truncateForPdf(g.remediation.admin_center_path, 160)}
                      </Text>
                      <Text style={{ width: "14%" }}>{effortLabel(g.remediation.effort)}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              <Text style={styles.h3}>Recommended upgrades (licensing implications)</Text>
              {m365Analysis.recommended_upgrades.slice(0, 6).map((u) => (
                <Text key={`${u.from_sku}-${u.to_sku}`} style={{ fontSize: 8, marginBottom: 5 }}>
                  • {u.priority}: {u.from_sku} → {u.to_sku}
                  {u.monthly_cost_per_user != null
                    ? ` (~$${u.monthly_cost_per_user}/user/mo list)`
                    : ""}
                  {"\n  "}
                  {truncateForPdf(u.capabilities_unlocked.join("; "), 200)}
                </Text>
              ))}

              <Text style={styles.h3}>Quick wins</Text>
              {m365Analysis.quick_wins.slice(0, 3).map((q) => (
                <View key={q.title} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9 }}>
                    {q.title} ({effortLabel(q.effort)} effort)
                  </Text>
                  <Text style={{ fontSize: 8, color: "#374151" }}>{q.description}</Text>
                  <Text style={{ fontSize: 7, color: "#64748b" }}>
                    {truncateForPdf(q.admin_center_path, 200)}
                  </Text>
                </View>
              ))}
            </View>
          </PageChrome>
        </>
      ) : null}

      {/* Full insights */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>Full insights</Text>
          {insP1.map((i) => {
            const b = severityBadgeStyle(i.severity);
            return (
              <View key={i.id} style={{ marginBottom: 10 }} wrap={false}>
                <View style={{ flexDirection: "row" }}>
                  <View style={[styles.badge, { backgroundColor: b.bg }]}>
                    <Text style={{ color: b.fg, fontSize: 7 }}>{i.severity}</Text>
                  </View>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, flex: 1 }}>
                    {i.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 9, marginTop: 3 }}>
                  {truncateForPdf(i.description, 520)}
                </Text>
                <Text style={{ fontSize: 8, color: "#1e40af", marginTop: 2 }}>
                  Action: {truncateForPdf(i.recommendedAction, 400)}
                </Text>
              </View>
            );
          })}
        </View>
      </PageChrome>

      {insP2.length > 0 ? (
        <PageChrome companyName={company}>
          <View style={{ marginTop: 14 }}>
            <Text style={styles.h2}>Full insights (continued)</Text>
            {insP2.map((i) => {
              const b = severityBadgeStyle(i.severity);
              return (
                <View key={i.id} style={{ marginBottom: 10 }} wrap={false}>
                  <View style={{ flexDirection: "row" }}>
                    <View style={[styles.badge, { backgroundColor: b.bg }]}>
                      <Text style={{ color: b.fg, fontSize: 7 }}>{i.severity}</Text>
                    </View>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, flex: 1 }}>
                      {i.title}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, marginTop: 3 }}>
                    {truncateForPdf(i.description, 520)}
                  </Text>
                  <Text style={{ fontSize: 8, color: "#1e40af", marginTop: 2 }}>
                    Action: {truncateForPdf(i.recommendedAction, 400)}
                  </Text>
                </View>
              );
            })}
          </View>
        </PageChrome>
      ) : null}

      {/* Recommended next step */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>Your recommended next step</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 8 }}>
            {recommendedNextStepHeadline(recommendedNextStep)}
          </Text>
          <Text style={styles.body}>
            {recommendedNextStepShortCallout(recommendedNextStep)}
          </Text>
          <Text style={styles.h3}>What{"'"}s included</Text>
          {nextDetail.included.map((line) => (
            <Text key={line} style={styles.body}>
              • {line}
            </Text>
          ))}
          <Text style={styles.h3}>Investment range</Text>
          <Text style={styles.body}>{nextDetail.investmentRange}</Text>
          <Text style={styles.h3}>Typical timeline</Text>
          <Text style={styles.body}>{nextDetail.timeline}</Text>
          <Text style={{ marginTop: 14, fontSize: 10 }}>
            <Link href={calendlyUrl} style={{ color: "#1d4ed8", textDecoration: "underline" }}>
              Book your discovery call
            </Link>
          </Text>
        </View>
      </PageChrome>

      {/* About */}
      <PageChrome companyName={company}>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.h2}>About Tulsa Applied AI</Text>
          <Text style={styles.body}>
            Tulsa Applied AI LLC helps operators in regulated and document-heavy
            industries adopt Microsoft 365 Copilot, Power Platform automation, and
            custom AI assistants without creating new compliance debt. We combine
            tenant hardening, workflow design, and change management so adoption
            sticks.
          </Text>
          <Text style={styles.h3}>Services ladder</Text>
          <Text style={styles.body}>
            • Foundation — MFA, sharing, labels, and policy baselines{"\n"}
            • Audit — ROI-ready workflow mapping and sequencing{"\n"}
            • Pilot — single workflow to measurable outcome in 90 days{"\n"}
            • Partnership — multi-track delivery with quarterly roadmapping
          </Text>
          <Text style={styles.h3}>Contact</Text>
          <Text style={styles.body}>
            Email: {contactEmail}
            {contactPhone.trim().length > 0
              ? `\nPhone: ${contactPhone}`
              : ""}
            {"\n"}
            Tulsa, Oklahoma — serving the central U.S. on-site and remotely nationwide
          </Text>
          <Text style={styles.footerNote}>
            This document is advisory in nature and not a legal, financial, or medical
            opinion. Microsoft, Microsoft 365, and Copilot are trademarks of the
            Microsoft group of companies.
          </Text>
        </View>
      </PageChrome>
    </Document>
  );
}
