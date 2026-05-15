import type { RecommendedNextStep } from "@/types/assessment";

export function recommendedNextStepHeadline(step: RecommendedNextStep): string {
  switch (step) {
    case "foundation_work":
      return "Foundation engagement — governance, identity, and data boundaries";
    case "audit":
      return "Operational audit — map ROI-ready workflows before you buy tools";
    case "pilot":
      return "Scoped pilot — one workflow, one metric, ninety days";
    case "retainer":
      return "Ongoing partnership — multi-track roadmap and delivery cadence";
  }
}

export function recommendedNextStepShortCallout(step: RecommendedNextStep): string {
  switch (step) {
    case "foundation_work":
      return (
        "Stabilize identity, compliance, and documentation so AI can be introduced " +
        "without creating new liability."
      );
    case "audit":
      return (
        "Pressure-test the top 3–5 candidate workflows with time studies, data " +
        "access maps, and a sequenced adoption plan."
      );
    case "pilot":
      return (
        "Stand up a single high-volume workflow with before/after metrics and an " +
        "explicit training plan for the team that owns it."
      );
    case "retainer":
      return (
        "Move from one-off experiments to a quarterly roadmap with concurrent " +
        "initiatives and executive-ready KPI reporting."
      );
  }
}

export interface NextStepEngagementDetail {
  included: string[];
  investmentRange: string;
  timeline: string;
}

export function nextStepEngagementDetail(
  step: RecommendedNextStep,
): NextStepEngagementDetail {
  switch (step) {
    case "foundation_work":
      return {
        included: [
          "Executive readout of this assessment with prioritized risks",
          "M365 / identity baseline checklist (MFA, sharing, audit retention)",
          "AI acceptable-use policy template + rollout comms",
          "Purview sensitivity label pilot plan (taxonomy + publication scope)",
        ],
        investmentRange: "$5,000 – $12,000 depending on tenant size and regulated data scope",
        timeline: "Typical timeline: 4–8 weeks",
      };
    case "audit":
      return {
        included: [
          "Workflow discovery workshops with department owners",
          "Time-motion and volume sampling on 2–3 candidate processes",
          "Integration + security/compliance reach matrix (what Copilot/automation can access safely)",
          "Written roadmap with ROI bands and licensing implications",
        ],
        investmentRange: "$2,500 fixed-fee discovery (credited toward pilot if you proceed within 60 days)",
        timeline: "Typical timeline: 2–3 weeks wall-clock",
      };
    case "pilot":
      return {
        included: [
          "Pilot charter: scope, success metric, rollback criteria",
          "Build + configure automation or Copilot workspace for one workflow",
          "Train-the-trainer sessions and office-hours during rollout",
          "30/60/90 scorecard readout for leadership",
        ],
        investmentRange: "$12,000 – $25,000 depending on integrations and change-management depth",
        timeline: "Typical timeline: 90 days active work",
      };
    case "retainer":
      return {
        included: [
          "Quarterly executive roadmap sessions",
          "2–3 concurrent delivery tracks (automation, Copilot, or custom agents)",
          "Office hours for champions + ticketed support SLA",
          "Vendor coordination (Microsoft CSP, LOB vendors) as needed",
        ],
        investmentRange: "$30,000 – $90,000+ annually depending on headcount and complexity",
        timeline: "Typical timeline: 12-month initial engagement; renewals quarterly",
      };
  }
}
