/**
 * Insight generator.
 *
 * The scoring engine produces numbers. This module turns those numbers —
 * plus the respondent's specific answers — into consultant-style
 * observations that drive the on-screen results page and the PDF roadmap.
 *
 * Design principles:
 *   - Rule-based so copy can be tweaked without touching scoring math.
 *   - Every rule references concrete question ids from `questions.json`, so
 *     adding or retiring a rule is a one-line change.
 *   - Rules are prioritised and de-duplicated by domain so we don't stack
 *     multiple critical insights on the same topic.
 *   - At least one `strength` insight always fires. Even low scorers should
 *     leave the report feeling respected, not shamed.
 */

import { getQuestion, loadCopilotSupplementalQuestions } from "@/lib/questions/bank";
import { extractM365Signals } from "@/lib/m365-gap-analysis";
import type { DomainId } from "@/lib/questions/types";
import type {
  AssessmentAnswer,
  AssessmentResponse,
  ReadinessTier,
  ScoreBreakdown,
} from "@/types/assessment";
import { determineReadinessTier } from "./calculateScores";

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export type InsightSeverity =
  | "critical"
  | "warning"
  | "opportunity"
  | "strength";

export interface Insight {
  id: string;
  /** Domain the insight is scoped to (or `"overall"` for cross-cutting). */
  dimension: DomainId | "overall";
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendedAction: string;
}

// -----------------------------------------------------------------------------
// Rule engine
// -----------------------------------------------------------------------------

interface InsightContext {
  scores: ScoreBreakdown;
  responses: AssessmentResponse;
  tier: ReadinessTier;
}

interface InsightRule {
  id: string;
  /** Higher priority rules are surfaced first. */
  priority: number;
  /** Domain category for de-dup (same domain + severity only fires once). */
  dimension: DomainId | "overall";
  matches: (ctx: InsightContext) => boolean;
  build: (ctx: InsightContext) => Omit<Insight, "id" | "dimension">;
}

const MAX_INSIGHTS = 8;
const MIN_INSIGHTS = 5;

// -----------------------------------------------------------------------------
// Response-inspection helpers
// -----------------------------------------------------------------------------

function toArray(answer: AssessmentAnswer | undefined): string[] {
  if (answer === undefined || answer === null) return [];
  if (Array.isArray(answer)) return answer.map(String);
  return [String(answer)];
}

function hasSelection(
  responses: AssessmentResponse,
  questionId: string,
  labels: string[],
): boolean {
  const selected = new Set(toArray(responses[questionId]));
  return labels.some((l) => selected.has(l));
}

function singleAnswer(
  responses: AssessmentResponse,
  questionId: string,
): string | null {
  const values = toArray(responses[questionId]);
  return values.length > 0 ? values[0] : null;
}

/** Human-readable list of selected option labels for a question. */
function selectionsAsPhrase(
  responses: AssessmentResponse,
  questionId: string,
): string {
  const selected = toArray(responses[questionId]);
  const question = getQuestion(questionId);
  if (!question) return selected.join(", ");
  const valid = selected.filter((l) =>
    question.options.some((o) => o.label === l),
  );
  if (valid.length === 0) return "";
  if (valid.length === 1) return valid[0];
  if (valid.length === 2) return `${valid[0]} and ${valid[1]}`;
  return `${valid.slice(0, -1).join(", ")}, and ${valid[valid.length - 1]}`;
}

// -----------------------------------------------------------------------------
// Regulatory + risk predicates
// -----------------------------------------------------------------------------

const REGULATED_COMPLIANCE_LABELS = [
  "HIPAA (patient health information)",
  "Oklahoma Bar / attorney-client privilege",
  "State insurance regulations / NAIC data standards",
  "SOC 2 obligations to customers",
  "PCI-DSS (card payments)",
  "Oil & gas data sovereignty / operator MSA confidentiality",
];

const LOW_MFA_LABELS = [
  "No one / MFA is not enforced",
  "Only a few admins use it voluntarily",
];

const BLOCKED_LEADERSHIP_LABELS = [
  "Blocked — leadership has banned AI tools",
];

const SHADOW_AI_UNMONITORED_LABELS = [
  "No idea — we don't monitor it",
  "Anecdotal awareness only",
];

const LOW_DOCUMENTATION_LABELS = [
  "Nothing written down — lives in people's heads",
  "A few critical SOPs exist, most do not",
];

const HIGH_DOCUMENT_VOLUME_LABELS = [
  "100 – 500/week",
  "500 – 2,000/week",
  "More than 2,000/week",
];

const HIGH_TOOL_SPRAWL_LABELS = [
  "16 – 25",
  "More than 25",
];

const VAGUE_COPILOT_INTENT_LABELS = [
  "Peer pressure — competitors or peers are using it",
  "Microsoft rep is pushing us",
  "Vague sense that we should be doing 'AI'",
];

const COPILOT_SUPPLEMENTAL = loadCopilotSupplementalQuestions();
function m365SignalSet(
  responses: AssessmentResponse,
): Set<string> {
  return new Set(extractM365Signals(responses, COPILOT_SUPPLEMENTAL));
}

// -----------------------------------------------------------------------------
// Rules
// -----------------------------------------------------------------------------

const RULES: InsightRule[] = [
  // ---------------------------------------------------------- CRITICAL ----
  {
    id: "compliance-gap",
    priority: 100,
    dimension: "data_security_compliance",
    matches: (ctx) =>
      ctx.scores.dataSecurityCompliance < 40 &&
      hasSelection(
        ctx.responses,
        "ds_compliance_requirements",
        REGULATED_COMPLIANCE_LABELS,
      ),
    build: (ctx) => {
      const regs = selectionsAsPhrase(ctx.responses, "ds_compliance_requirements");
      return {
        severity: "critical",
        title: "Compliance Gap Before AI Adoption",
        description:
          regs.length > 0
            ? `You indicated ${regs} applies to your business, but your Data Security & Compliance score is ${ctx.scores.dataSecurityCompliance}. Deploying Copilot or any AI on top of a shaky compliance foundation is how regulated data ends up in the wrong place. The governance work must come first.`
            : `Your Data Security & Compliance score (${ctx.scores.dataSecurityCompliance}) is too low to safely introduce AI tooling that reads company data.`,
        recommendedAction:
          "Start with a compliance-first foundation engagement: Purview sensitivity labels, DLP policies, BAAs/DPAs, and an AI acceptable-use policy. Only after those are in place should AI roll out.",
      };
    },
  },
  {
    id: "shadow-ai-risk",
    priority: 95,
    dimension: "technology_infrastructure",
    matches: (ctx) =>
      hasSelection(ctx.responses, "tech_shadow_ai", SHADOW_AI_UNMONITORED_LABELS) &&
      hasSelection(
        ctx.responses,
        "ds_compliance_requirements",
        REGULATED_COMPLIANCE_LABELS,
      ),
    build: (ctx) => {
      const shadow = singleAnswer(ctx.responses, "tech_shadow_ai");
      return {
        severity: "critical",
        title: "Shadow AI Is Your Biggest Silent Risk",
        description: `You said ${shadow ? `"${shadow}"` : "you don't monitor shadow AI"} while also handling regulated data. Right now, there is almost certainly an employee pasting client information into ChatGPT free, Grammarly, or consumer Copilot — each of which has no BAA and trains on the input.`,
        recommendedAction:
          "Immediate: publish an AI acceptable-use policy and communicate it this week. Next 30 days: turn on Defender for Cloud Apps (or equivalent CASB) to see what people are actually using, then sanction the tools that have a BAA and block the ones that don't.",
      };
    },
  },
  {
    id: "blocked-leadership",
    priority: 92,
    dimension: "team_change_management",
    matches: (ctx) =>
      hasSelection(ctx.responses, "team_leadership_stance", BLOCKED_LEADERSHIP_LABELS),
    build: () => ({
      severity: "critical",
      title: "Leadership Has Banned AI — That's the Work",
      description:
        "Leadership has currently banned AI tools. That means no pilot, no Copilot rollout, no ROI — until the underlying concern (usually data leakage or quality risk) is addressed head-on. The technical problems are easier to solve than the executive one.",
      recommendedAction:
        "Don't buy AI tools yet. Start with a 60-minute executive briefing on realistic risk boundaries (BAAs, DLP, audit logs) and a one-page written policy. When leadership has a concrete yes/no framework, they almost always say yes.",
    }),
  },
  {
    id: "copilot-bought-foundation",
    priority: 99,
    dimension: "technology_infrastructure",
    matches: (ctx) => {
      const sigs = m365SignalSet(ctx.responses);
      return (
        sigs.has("copilot_purchased_low_adoption") &&
        ctx.scores.dataSecurityCompliance < 60
      );
    },
    build: () => ({
      severity: "critical",
      title: "Copilot Purchased, Foundation Not Ready",
      description:
        "You've already bought Copilot seats, but your responses suggest the M365 foundation isn't ready to deploy them safely. This is the #1 pattern we see — organizations buy first, then discover Copilot is surfacing the wrong information to the wrong people. The seats are still valid — we just need to fix the foundation before rolling out.",
      recommendedAction:
        "Pause any wider rollout. Start with a Security & Governance Foundation engagement to fix permissions and deploy sensitivity labels before expanding users.",
    }),
  },
  {
    id: "sharepoint-blast-copilot",
    priority: 98,
    dimension: "data_security_compliance",
    matches: (ctx) => {
      const s = m365SignalSet(ctx.responses);
      return s.has("sharepoint_oversharing_critical") || s.has("sharepoint_unknown");
    },
    build: () => ({
      severity: "critical",
      title: "SharePoint Permissions Unknown = Copilot Blast Radius Unknown",
      description:
        "Copilot will surface any document a user has permission to read. If your SharePoint permissions haven't been audited, you don't know what Copilot will expose. The enterprise average is 340+ overshared sites; the SMB pattern is often worse because permissions were never strictly scoped.",
      recommendedAction:
        "Run a SharePoint Advanced Management permissions report before the first Copilot license goes live. If you don't have SAM, this is part of what our Foundation engagement delivers.",
    }),
  },

  // ---------------------------------------------------------- WARNINGS ----
  {
    id: "data-fragmentation",
    priority: 80,
    dimension: "data_security_compliance",
    matches: (ctx) =>
      ctx.scores.dataSecurityCompliance < 40 &&
      !hasSelection(
        ctx.responses,
        "ds_compliance_requirements",
        REGULATED_COMPLIANCE_LABELS,
      ),
    build: (ctx) => ({
      severity: "warning",
      title: "Security Posture Limits What AI Can Safely Touch",
      description: `Your Data Security & Compliance score is ${ctx.scores.dataSecurityCompliance}. Even without regulated data, basic controls — MFA for everyone, documented sharing rules, sensible backups — are what keep AI from summarizing things it shouldn't or leaking to a former employee's account.`,
      recommendedAction:
        "The three highest-leverage moves: enforce MFA for every user, lock down external sharing defaults in SharePoint/OneDrive, and stand up audit log retention at 1 year. All three can land in two weeks.",
    }),
  },
  {
    id: "mfa-missing",
    priority: 78,
    dimension: "data_security_compliance",
    matches: (ctx) =>
      hasSelection(ctx.responses, "ds_mfa_coverage", LOW_MFA_LABELS),
    build: (ctx) => ({
      severity: "warning",
      title: "MFA Gaps Are a Showstopper for Copilot",
      description: `You indicated "${
        singleAnswer(ctx.responses, "ds_mfa_coverage") ?? "limited MFA"
      }". Copilot and most serious AI tools assume every user is protected by MFA. Without it, an account takeover becomes an AI-assisted data exfiltration event.`,
      recommendedAction:
        "Roll out Microsoft Authenticator (or equivalent) to 100% of users before the pilot starts. Conditional Access can require it without disrupting day-to-day work.",
    }),
  },
  {
    id: "change-mgmt-risk",
    priority: 75,
    dimension: "team_change_management",
    matches: (ctx) => ctx.scores.teamChangeManagement < 40,
    build: (ctx) => ({
      severity: "warning",
      title: "Change-Management Risk Is Higher Than the Tech Risk",
      description: `Your Team & Change Management score is ${ctx.scores.teamChangeManagement}. In our experience the pilot that fails on adoption — not on the AI itself — is the norm for businesses scoring in this range.`,
      recommendedAction:
        "Identify one internal champion per department, pick a pilot use-case that saves them personal time (not a corporate KPI), and budget as much on training and change management as on the tools themselves.",
    }),
  },
  {
    id: "low-documentation",
    priority: 72,
    dimension: "operational_process_maturity",
    matches: (ctx) =>
      hasSelection(
        ctx.responses,
        "op_process_documentation",
        LOW_DOCUMENTATION_LABELS,
      ),
    build: () => ({
      severity: "warning",
      title: "AI Can Only Automate What Someone Can Explain",
      description:
        "Your process documentation is thin. AI agents, Power Automate flows, and custom GPTs all need the same raw material: a clear SOP. Without one, the pilot stalls at week 3 when the consultant has to reverse-engineer the workflow from scratch.",
      recommendedAction:
        "Pick the single highest-volume process and write a 1-page SOP before the pilot starts. This alone typically saves weeks of implementation time and doubles as the prompt spec.",
    }),
  },
  {
    id: "tool-sprawl",
    priority: 68,
    dimension: "operational_process_maturity",
    matches: (ctx) =>
      hasSelection(ctx.responses, "op_tool_sprawl", HIGH_TOOL_SPRAWL_LABELS),
    build: (ctx) => ({
      severity: "warning",
      title: "Tool Sprawl Dilutes the Payoff",
      description: `You run ${singleAnswer(ctx.responses, "op_tool_sprawl") ?? "a lot of"} SaaS apps daily. Each one is a separate AI integration surface — and the value of AI compounds when it can reach across systems, which fragmentation prevents.`,
      recommendedAction:
        "Before (or alongside) the AI investment, run a 30-day SaaS inventory and consolidate duplicate tooling. You will usually find 20-30% wasted spend and a much cleaner target surface for automation.",
    }),
  },
  {
    id: "copilot-vague-intent",
    priority: 66,
    dimension: "financial_strategic_alignment",
    matches: (ctx) =>
      hasSelection(
        ctx.responses,
        "COPILOT_INTENT",
        VAGUE_COPILOT_INTENT_LABELS,
      ),
    build: () => ({
      severity: "warning",
      title: "Tool First, Use Case Second",
      description:
        "Your responses suggest Copilot interest is being driven by external pressure rather than specific internal use cases. This is the pattern behind most failed Copilot deployments. The same $18/seat spent on a clearly-scoped automation often delivers 3-5x more value than Copilot deployed hoping someone will find a use.",
      recommendedAction:
        "Identify 2-3 specific, high-volume workflows where Copilot could clearly help before buying seats. Our Operational Audit ($2,500) maps this in 2 weeks.",
    }),
  },

  // ------------------------------------------------------- OPPORTUNITIES --
  {
    id: "strong-foundation-unclear-direction",
    priority: 60,
    dimension: "financial_strategic_alignment",
    matches: (ctx) =>
      ctx.scores.operationalProcessMaturity >= 70 &&
      ctx.scores.financialStrategicAlignment < 40,
    build: (ctx) => ({
      severity: "opportunity",
      title: "Strong Foundation, Unclear Direction",
      description: `You have the operational discipline to succeed with AI (process maturity ${ctx.scores.operationalProcessMaturity}), but the strategic picture is less defined (${ctx.scores.financialStrategicAlignment}). That's actually a great position — the expensive work is already done.`,
      recommendedAction:
        "A focused Operational Audit (2 weeks, fixed fee) will identify the 2-3 highest-ROI AI targets in your specific workflows and produce a prioritised roadmap. That's where we'd start.",
    }),
  },
  {
    id: "high-volume-opportunity",
    priority: 58,
    dimension: "operational_process_maturity",
    matches: (ctx) =>
      hasSelection(
        ctx.responses,
        "op_document_volume",
        HIGH_DOCUMENT_VOLUME_LABELS,
      ),
    build: (ctx) => {
      const volume = singleAnswer(ctx.responses, "op_document_volume");
      return {
        severity: "opportunity",
        title: "High Document Volume Is a Clear Automation Target",
        description: `You process ${volume ?? "a large volume of"} documents each week. Every repeated template — intake forms, claims packets, proposals — is a place a purpose-built assistant can save hours.`,
        recommendedAction:
          "A single document-centric pilot (Copilot on SharePoint, or a custom GPT trained on your templates) will almost certainly return 3-5x in the first year. Pick the template with the most repetition and the clearest quality bar.",
      };
    },
  },
  {
    id: "copilot-pricing-window",
    priority: 59,
    dimension: "financial_strategic_alignment",
    matches: (ctx) => {
      const s = m365SignalSet(ctx.responses);
      return s.has("copilot_evaluating") || s.has("copilot_not_considered");
    },
    build: () => ({
      severity: "opportunity",
      title: "Copilot Promotional Pricing Window",
      description:
        "Microsoft 365 Copilot Business is currently $18/user/month on annual commit — a 17% discount off the standard $21 rate. This promotional window ends June 30, 2026. If you're seriously considering Copilot, the financial case is stronger before that date.",
      recommendedAction:
        "Use this assessment to verify you're ready before committing. Budget roughly $216/user/year for the license plus typical $150-$400/user in first-year rollout support costs.",
    }),
  },
  {
    id: "pilot-ready",
    priority: 55,
    dimension: "overall",
    matches: (ctx) =>
      ctx.tier === "pilot" && ctx.scores.financialStrategicAlignment >= 50,
    build: () => ({
      severity: "opportunity",
      title: "You're Ready for a Scoped Pilot",
      description:
        "Your overall readiness puts you in the pilot tier — foundational controls in place, operational discipline solid, and enough strategic intent to measure outcomes. This is the right moment to scope a narrow, time-boxed pilot rather than an abstract experiment.",
      recommendedAction:
        "Aim for a 90-day pilot on a single workflow with a clear before/after metric. Keep it to one department and one tool to prove the ROI model before scaling.",
    }),
  },
  {
    id: "scale-ready",
    priority: 55,
    dimension: "overall",
    matches: (ctx) => ctx.tier === "scale",
    build: () => ({
      severity: "opportunity",
      title: "Scale-Ready — Productize Your AI Investment",
      description:
        "Your readiness is in the top tier: strong security posture, modern infrastructure, mature processes, and strategic clarity. Most businesses scoring here are ready for an ongoing engagement, not a one-off pilot.",
      recommendedAction:
        "Move to a retainer model: quarterly roadmapping, 2-3 concurrent AI initiatives, and a measured KPI for each. You will plateau without that cadence.",
    }),
  },

  // ---------------------------------------------------------- STRENGTHS ---
  {
    id: "strength-compliance",
    priority: 40,
    dimension: "data_security_compliance",
    matches: (ctx) => ctx.scores.dataSecurityCompliance >= 75,
    build: (ctx) => ({
      severity: "strength",
      title: "Your Compliance Posture Is a Real Competitive Edge",
      description: `Your Data Security & Compliance score of ${ctx.scores.dataSecurityCompliance} puts you ahead of most SMBs we assess. Copilot, Azure OpenAI, and similar tenant-bound AI will work as intended for you — the controls they depend on are already in place.`,
      recommendedAction:
        "Lean into this in your sales motion. Clients in regulated industries pick providers they trust with their data before they pick providers with the best tools.",
    }),
  },
  {
    id: "strength-operations",
    priority: 38,
    dimension: "operational_process_maturity",
    matches: (ctx) => ctx.scores.operationalProcessMaturity >= 75,
    build: (ctx) => ({
      severity: "strength",
      title: "Operational Discipline Will Compound Your AI ROI",
      description: `Process maturity at ${ctx.scores.operationalProcessMaturity} means the underlying workflows are documented and measurable. AI implementations land 2-3x faster in shops like yours because the integration spec is already 80% written.`,
      recommendedAction:
        "Share your SOPs and KPIs directly with whoever you engage — don't make them guess. It meaningfully shortens the learning curve.",
    }),
  },
  {
    id: "strength-team",
    priority: 36,
    dimension: "team_change_management",
    matches: (ctx) => ctx.scores.teamChangeManagement >= 75,
    build: (ctx) => ({
      severity: "strength",
      title: "Change-Ready Team — The Rare Ingredient",
      description: `Team & Change Management score of ${ctx.scores.teamChangeManagement} is unusual. Most AI pilots fail on adoption, not on the tech — a team that adopts rapidly is the single best predictor of ROI.`,
      recommendedAction:
        "Give your power users real autonomy — budget for experimentation, a Slack/Teams channel for wins, and explicit permission to break things on a sandbox tenant.",
    }),
  },
  {
    id: "strength-tech",
    priority: 34,
    dimension: "technology_infrastructure",
    matches: (ctx) => ctx.scores.technologyInfrastructure >= 75,
    build: (ctx) => ({
      severity: "strength",
      title: "Modern Tech Stack Gives You a Head Start",
      description: `Your Technology Infrastructure score of ${ctx.scores.technologyInfrastructure} means Copilot, Azure OpenAI, or equivalent tooling will plug in with minimal heavy lifting. You're past the biggest prerequisite most SMBs have to work through.`,
      recommendedAction:
        "Focus the engagement on use-case design, not infrastructure catch-up. The expensive plumbing is already in place.",
    }),
  },
  {
    id: "strength-strategic",
    priority: 32,
    dimension: "financial_strategic_alignment",
    matches: (ctx) => ctx.scores.financialStrategicAlignment >= 75,
    build: (ctx) => ({
      severity: "strength",
      title: "Clear Strategic Intent — Money Will Follow Outcomes",
      description: `Financial & Strategic Alignment of ${ctx.scores.financialStrategicAlignment} means budget, timeline, and decision-making are lined up. Engagements with clients scoring here close faster and deliver cleaner ROI because there's no committee lag.`,
      recommendedAction:
        "Lock in the first metric now — what specifically are you going to measure before/after. That one sentence is worth more than a 20-page strategy deck.",
    }),
  },

  // ---------------------------------------- Fallback strength (always on) --
  {
    id: "strength-engagement",
    priority: 1,
    dimension: "overall",
    matches: () => true,
    build: () => ({
      severity: "strength",
      title: "You Took the First Step — That's Rarer Than It Sounds",
      description:
        "Most operators talk about AI. The ones who move on it start where you did: with an honest baseline. That alone separates you from about 80% of your peers.",
      recommendedAction:
        "Use this report as a working document. Share it with your leadership team, pick one insight to act on in the next 30 days, and revisit in a quarter.",
    }),
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Produce the prioritised insight list for a completed assessment.
 *
 * Algorithm:
 *   1. Evaluate every rule against the context.
 *   2. Sort by priority (desc) then by rule order in the source (stable).
 *   3. De-duplicate: keep at most one critical/warning per domain.
 *   4. Ensure at least one `strength` insight is present.
 *   5. Cap at `MAX_INSIGHTS` and ensure at least `MIN_INSIGHTS`.
 */
export function generateInsights(
  scores: ScoreBreakdown,
  responses: AssessmentResponse,
): Insight[] {
  const tier = determineReadinessTier(scores.overall);
  const ctx: InsightContext = { scores, responses, tier };

  const matched = RULES.filter((r) => r.matches(ctx)).sort(
    (a, b) => b.priority - a.priority,
  );

  const kept: Insight[] = [];
  const seenDomainSeverity = new Set<string>();

  for (const rule of matched) {
    const built = rule.build(ctx);
    // One strong-severity insight per domain is plenty — avoid piling up.
    const key = `${rule.dimension}:${built.severity}`;
    if (
      (built.severity === "critical" || built.severity === "warning") &&
      seenDomainSeverity.has(key)
    ) {
      continue;
    }
    seenDomainSeverity.add(key);

    kept.push({ id: rule.id, dimension: rule.dimension, ...built });
    if (kept.length >= MAX_INSIGHTS) break;
  }

  // Guarantee a strength insight exists — the fallback rule matches `() => true`,
  // so it will always be in `matched`, but a high-scoring respondent might fill
  // the 8-slot cap with opportunities/strengths already. Verify anyway.
  if (!kept.some((i) => i.severity === "strength")) {
    const fallback = RULES.find((r) => r.id === "strength-engagement")!;
    kept.push({
      id: fallback.id,
      dimension: fallback.dimension,
      ...fallback.build(ctx),
    });
  }

  // Pad up to MIN_INSIGHTS if the respondent somehow matched fewer — unusual,
  // but could happen if someone only answers one question.
  if (kept.length < MIN_INSIGHTS) {
    for (const rule of RULES) {
      if (kept.some((i) => i.id === rule.id)) continue;
      if (!rule.matches(ctx)) continue;
      kept.push({
        id: rule.id,
        dimension: rule.dimension,
        ...rule.build(ctx),
      });
      if (kept.length >= MIN_INSIGHTS) break;
    }
  }

  return kept.slice(0, MAX_INSIGHTS);
}

// Exported for tests + future UI that wants to enumerate the full rule set.
export const INSIGHT_RULE_IDS = RULES.map((r) => r.id);
