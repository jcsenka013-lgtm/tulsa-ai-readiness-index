/**
 * Microsoft 365 Security Gap Analysis — PDF report section generator.
 *
 * Consumes the "Data Security & Compliance Posture" answers from the Tulsa AI
 * Readiness assessment (S1, S2, S2a, S3) plus optional M365 posture keys.
 * When optional keys are absent, the engine assumes "unknown" and surfaces
 * conservative gaps — appropriate for owners who have not yet inventory'd M365.
 *
 * Optional response keys (string values unless noted):
 * - `m365_license_tier`: business_basic | business_standard | business_premium | e3 | e5
 * - `m365_entra_plan`: free | p1 | p2
 * - `m365_exchange_online`: yes | no
 * - `m365_onedrive`: yes | no
 * - `m365_loop`: yes | no | not_applicable
 * - `m365_sensitivity_labels`: none | pilot | org_wide
 * - `m365_restricted_sharepoint_search`: yes | no | not_applicable
 * - `m365_copilot_add_on`: yes | no
 * - `m365_dlp`: none | basic | standard | advanced
 * - `m365_audit_retention`: under_90 | 90_days | one_year_plus
 * - `m365_baa_status`: executed | not_executed | not_applicable
 * - `m365_external_sharing`: open | limited | blocked
 * - `m365_privileged_access_workstations`: yes | no | partial
 * - `m365_hybrid_identity`: yes | no
 * - `m365_customer_lockbox`: yes | no | not_sure
 * - `m365_purview_insider_risk`: yes | no
 * - `m365_communication_compliance`: yes | no
 */

import { loadCopilotSupplementalQuestions } from "@/lib/questions/bank";
import type { BankQuestion } from "@/lib/questions/types";
import type { AssessmentResponse } from "@/types/assessment";
import type { EmployeeCountRange, Industry } from "@/types/assessment";

// -----------------------------------------------------------------------------
// Output types
// -----------------------------------------------------------------------------

export type CopilotReadinessStatus =
  | "blocked"
  | "possible_with_upgrades"
  | "ready_with_gaps"
  | "ready";

export type PrerequisiteStatus = "met" | "partial" | "not_met";

export interface CopilotPrerequisiteRow {
  requirement: string;
  status: PrerequisiteStatus;
  action_needed: string;
}

export type ComplianceRiskLevel = "low" | "medium" | "high" | "critical";

export type RemediationEffort = "low" | "medium" | "high";

export interface GapRemediation {
  what_to_do: string;
  admin_center_path: string;
  effort: RemediationEffort;
  license_requirement: string | null;
  estimated_cost: string;
}

export interface ComplianceGap {
  control: string;
  industry_requirement: string;
  current_state: string;
  risk_level: ComplianceRiskLevel;
  remediation: GapRemediation;
}

export type UpgradePriority = "P0" | "P1" | "P2" | "P3";

export interface RecommendedUpgrade {
  from_sku: string;
  to_sku: string;
  monthly_cost_per_user: number | null;
  capabilities_unlocked: string[];
  priority: UpgradePriority;
}

export interface QuickWin {
  title: string;
  description: string;
  admin_center_path: string;
  effort: RemediationEffort;
}

export interface SecurityRoadmap {
  days_0_30: string[];
  days_31_60: string[];
  days_61_90: string[];
}

export type DetectedLicenseTier =
  | "microsoft_365_business_basic"
  | "microsoft_365_business_standard"
  | "microsoft_365_business_premium"
  | "microsoft_365_e3"
  | "microsoft_365_e5"
  | "unknown";

export interface M365GapAnalysisReport {
  current_license_tier: DetectedLicenseTier;
  copilot_readiness_status: CopilotReadinessStatus;
  copilot_prerequisites_status: CopilotPrerequisiteRow[];
  compliance_gaps: ComplianceGap[];
  recommended_upgrades: RecommendedUpgrade[];
  quick_wins: QuickWin[];
  security_roadmap: SecurityRoadmap;
  /** Narrative hooks for PDF copy — optional consumer may ignore */
  executive_summary_bullets: string[];
  /**
   * When supplemental answers show no Microsoft 365 tenant, Copilot for
   * Microsoft 365 is not the right product fit; surface on results/PDF.
   */
  copilot_relevance?: {
    status: "microsoft_365_tenant" | "not_microsoft_365_tenant";
    message: string;
  };
}

export interface M365GapAnalysisInput {
  responses: AssessmentResponse;
  industry: Industry;
  employeeCountRange: EmployeeCountRange;
  /**
   * Optional `m365_signal` values from Copilot supplemental question options
   * (see `extractM365Signals`). When omitted, derived from the supplemental
   * bank and `responses` via `buildM365GapAnalysisInput`.
   */
  m365Signals?: string[];
}

// -----------------------------------------------------------------------------
// Internal posture model
// -----------------------------------------------------------------------------

type TriState = "yes" | "no" | "unknown";

interface ParsedPosture {
  licenseTier: DetectedLicenseTier;
  entraPlan: "free" | "p1" | "p2" | "unknown";
  exchangeOnline: TriState;
  oneDrive: TriState;
  loop: TriState;
  sensitivityLabels: "none" | "pilot" | "org_wide" | "unknown";
  restrictedSpSearch: TriState;
  copilotAddOn: TriState;
  dlp: "none" | "basic" | "standard" | "advanced" | "unknown";
  auditRetention: "under_90" | "90_days" | "one_year_plus" | "unknown";
  baaExecuted: TriState;
  externalSharing: "open" | "limited" | "blocked" | "unknown";
  hybridIdentity: TriState;
  insiderRisk: TriState;
  communicationCompliance: TriState;
  customerLockbox: TriState;
  /** From assessment S1-S3 */
  securityDocs: "none" | "informal" | "partial" | "enforced" | "unknown";
  securityTraining: "never" | "once" | "annual" | "quarterly_plus" | "unknown";
  regulatedData: {
    phi: boolean;
    pci: boolean;
    legalPrivileged: boolean;
    pii: boolean;
    none: boolean;
  };
  governanceForRegulated:
    | "none"
    | "basic_passwords"
    | "access_training"
    | "formal_program"
    | "unknown"
    | "n_a";
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  return undefined;
}

function parseTriState(
  responses: AssessmentResponse,
  key: string,
  whenMissing: TriState = "unknown",
): TriState {
  const raw = asString(responses[key])?.toLowerCase().trim();
  if (raw === "yes" || raw === "true" || raw === "executed") return "yes";
  if (raw === "no" || raw === "false" || raw === "not_executed") return "no";
  if (raw === "not_applicable" || raw === "na") {
    return "unknown";
  }
  return whenMissing;
}

function parseLicenseTier(responses: AssessmentResponse): DetectedLicenseTier {
  const v = asString(responses.m365_license_tier)?.toLowerCase().trim();
  switch (v) {
    case "business_basic":
    case "m365_business_basic":
    case "microsoft_365_business_basic":
      return "microsoft_365_business_basic";
    case "business_standard":
    case "m365_business_standard":
      return "microsoft_365_business_standard";
    case "business_premium":
    case "m365_business_premium":
      return "microsoft_365_business_premium";
    case "e3":
    case "m365_e3":
    case "enterprise_e3":
      return "microsoft_365_e3";
    case "e5":
    case "m365_e5":
    case "enterprise_e5":
      return "microsoft_365_e5";
    default:
      return inferLicenseFromGovernance(responses);
  }
}

/**
 * When SKU is not self-reported, infer a conservative floor from security
 * maturity — never assume Premium/E5 without evidence.
 */
function inferLicenseFromGovernance(
  responses: AssessmentResponse,
): DetectedLicenseTier {
  const s1 = asString(responses.S1);
  const s2a = asString(responses.S2a);
  if (s1 === "documented_enforced" && s2a === "formal_compliance_program") {
    return "microsoft_365_business_standard";
  }
  if (s1 === "none" || s1 === "informal") {
    return "microsoft_365_business_basic";
  }
  return "unknown";
}

function parseS2Multi(responses: AssessmentResponse): ParsedPosture["regulatedData"] {
  const raw = responses.S2;
  const selected = Array.isArray(raw)
    ? raw.map((x) => String(x).toLowerCase())
    : [];
  const has = (v: string) => selected.includes(v);
  const hasSensitive =
    has("phi_hipaa") ||
    has("financial_pci") ||
    has("legal_privileged") ||
    has("personal_pii");
  const none = !hasSensitive;
  return {
    phi: has("phi_hipaa"),
    pci: has("financial_pci"),
    legalPrivileged: has("legal_privileged"),
    pii: has("personal_pii"),
    none,
  };
}

function parseGovernance(responses: AssessmentResponse): ParsedPosture["governanceForRegulated"] {
  const rd = parseS2Multi(responses);
  const handlesRegulated =
    rd.phi || rd.pci || rd.legalPrivileged || rd.pii;
  if (!handlesRegulated) return "n_a";
  const s2a = asString(responses.S2a);
  switch (s2a) {
    case "none":
      return "none";
    case "basic_passwords":
      return "basic_passwords";
    case "access_controls_training":
      return "access_training";
    case "formal_compliance_program":
      return "formal_program";
    default:
      return "unknown";
  }
}

function parseSecurityDocs(
  responses: AssessmentResponse,
): ParsedPosture["securityDocs"] {
  const s1 = asString(responses.S1);
  switch (s1) {
    case "none":
      return "none";
    case "informal":
      return "informal";
    case "documented_partial":
      return "partial";
    case "documented_enforced":
      return "enforced";
    default:
      return "unknown";
  }
}

function parseSecurityTraining(
  responses: AssessmentResponse,
): ParsedPosture["securityTraining"] {
  const s3 = asString(responses.S3);
  switch (s3) {
    case "never":
      return "never";
    case "once":
      return "once";
    case "annual":
      return "annual";
    case "quarterly_or_more":
      return "quarterly_plus";
    default:
      return "unknown";
  }
}

function parseEntraPlan(
  responses: AssessmentResponse,
): ParsedPosture["entraPlan"] {
  const v = asString(responses.m365_entra_plan)?.toLowerCase().trim();
  if (v === "p2" || v === "entra_p2") return "p2";
  if (v === "p1" || v === "entra_p1") return "p1";
  if (v === "free" || v === "included") return "free";
  return "unknown";
}

function parseSensitivity(
  responses: AssessmentResponse,
): ParsedPosture["sensitivityLabels"] {
  const v = asString(responses.m365_sensitivity_labels)?.toLowerCase().trim();
  if (v === "none") return "none";
  if (v === "pilot") return "pilot";
  if (v === "org_wide" || v === "organization_wide") return "org_wide";
  return "unknown";
}

function parseDlp(
  responses: AssessmentResponse,
): ParsedPosture["dlp"] {
  const v = asString(responses.m365_dlp)?.toLowerCase().trim();
  if (v === "none") return "none";
  if (v === "basic") return "basic";
  if (v === "standard") return "standard";
  if (v === "advanced") return "advanced";
  return "unknown";
}

function parseAudit(
  responses: AssessmentResponse,
): ParsedPosture["auditRetention"] {
  const v = asString(responses.m365_audit_retention)?.toLowerCase().trim();
  if (v === "under_90") return "under_90";
  if (v === "90_days" || v === "90") return "90_days";
  if (v === "one_year_plus" || v === "1y_plus") return "one_year_plus";
  return "unknown";
}

function parseExternalSharing(
  responses: AssessmentResponse,
): ParsedPosture["externalSharing"] {
  const v = asString(responses.m365_external_sharing)?.toLowerCase().trim();
  if (v === "open" || v === "unrestricted") return "open";
  if (v === "limited") return "limited";
  if (v === "blocked") return "blocked";
  return "unknown";
}

function parsePosture(
  responses: AssessmentResponse,
): ParsedPosture {
  const rd = parseS2Multi(responses);
  return {
    licenseTier: parseLicenseTier(responses),
    entraPlan: parseEntraPlan(responses),
    exchangeOnline: parseTriState(responses, "m365_exchange_online"),
    oneDrive: parseTriState(responses, "m365_onedrive"),
    loop: parseTriState(responses, "m365_loop"),
    sensitivityLabels: parseSensitivity(responses),
    restrictedSpSearch: parseTriState(responses, "m365_restricted_sharepoint_search"),
    copilotAddOn: parseTriState(responses, "m365_copilot_add_on"),
    dlp: parseDlp(responses),
    auditRetention: parseAudit(responses),
    baaExecuted: parseTriState(responses, "m365_baa_status", "unknown"),
    externalSharing: parseExternalSharing(responses),
    hybridIdentity: parseTriState(responses, "m365_hybrid_identity"),
    insiderRisk: parseTriState(responses, "m365_purview_insider_risk"),
    communicationCompliance: parseTriState(
      responses,
      "m365_communication_compliance",
    ),
    customerLockbox: parseTriState(responses, "m365_customer_lockbox"),
    securityDocs: parseSecurityDocs(responses),
    securityTraining: parseSecurityTraining(responses),
    regulatedData: rd,
    governanceForRegulated: parseGovernance(responses),
  };
}

function qualifiesCopilotBaseLicense(tier: DetectedLicenseTier): boolean {
  return (
    tier === "microsoft_365_business_standard" ||
    tier === "microsoft_365_business_premium" ||
    tier === "microsoft_365_e3" ||
    tier === "microsoft_365_e5"
  );
}

function purviewTierLabel(tier: DetectedLicenseTier): string {
  switch (tier) {
    case "microsoft_365_business_premium":
      return "Business Premium — Microsoft Purview Information Protection (labels) + endpoint DLP basics; not full enterprise DLP stack.";
    case "microsoft_365_e3":
      return "E3 — Full Microsoft Purview Information Protection + DLP for Microsoft 365 locations (Exchange, SharePoint, OneDrive, Teams).";
    case "microsoft_365_e5":
      return "E5 — Adds Insider Risk Management, Communication Compliance, advanced eDiscovery, Customer Key (with correct add-ons/planning).";
    case "microsoft_365_business_standard":
      return "Business Standard — No Microsoft Purview org-wide DLP/labels SKU parity with E3; upgrade required for enterprise-class protection.";
    case "microsoft_365_business_basic":
      return "Business Basic — Web/mobile apps only; not a Copilot-qualified base SKU; no desktop Office; weakest compliance tooling.";
    default:
      return "Unknown — verify actual SKU assignments in Microsoft 365 admin center (Billing → Your products).";
  }
}

function entraCapabilitySummary(plan: ParsedPosture["entraPlan"]): string {
  switch (plan) {
    case "p2":
      return "Entra ID P2 — Identity Protection + Privileged Identity Management (PIM) + risk-based Conditional Access policies.";
    case "p1":
      return "Entra ID P1 — Conditional Access, dynamic groups, cloud app discovery basics, self-service password reset policies.";
    case "free":
      return "Entra ID Free — Directory sync, basic SSO; MFA via per-user or Security Defaults (limited compared to CA policies).";
    default:
      return "Entra tier not confirmed — baseline with Security Defaults or CA templates, then license P1 minimum for regulated tenants.";
  }
}

function estimatedUsersBand(range: EmployeeCountRange): string {
  switch (range) {
    case "1-5":
      return "~5";
    case "6-20":
      return "~20";
    case "21-50":
      return "~50";
    case "51-100":
      return "~100";
    case "100+":
      return "100+";
    default:
      return "your headcount";
  }
}

// -----------------------------------------------------------------------------
// Copilot prerequisites
// -----------------------------------------------------------------------------

function buildCopilotPrerequisites(p: ParsedPosture): CopilotPrerequisiteRow[] {
  const rows: CopilotPrerequisiteRow[] = [];

  const baseOk = qualifiesCopilotBaseLicense(p.licenseTier);
  rows.push({
    requirement:
      "Qualifying Microsoft 365 base subscription (Business Standard/Premium or Enterprise E3/E5)",
    status: baseOk ? "met" : p.licenseTier === "unknown" ? "partial" : "not_met",
    action_needed: baseOk
      ? "Maintain active assignments; remove legacy/alternate SKUs that block service plans."
      : "Assign Business Standard (minimum), Business Premium, or Enterprise E3/E5 to Copilot users. Business Basic does not qualify.",
  });

  rows.push({
    requirement: "Copilot for Microsoft 365 add-on ($30/user/month at list)",
    status:
      p.copilotAddOn === "yes"
        ? "met"
        : p.copilotAddOn === "unknown"
          ? "partial"
          : "not_met",
    action_needed:
      p.copilotAddOn === "yes"
        ? "Validate CoPilot service plan is active on each user in Microsoft 365 admin center."
        : "Purchase Copilot for Microsoft 365 licenses and assign to a pilot group before broad rollout.",
  });

  const exOk = p.exchangeOnline === "yes";
  rows.push({
    requirement: "Exchange Online mailbox for each user (Copilot email/Outlook scenarios)",
    status:
      exOk ? "met" : p.exchangeOnline === "unknown" ? "partial" : "not_met",
    action_needed: exOk
      ? "Confirm mailboxes are in Exchange Online (not remaining on-premises only)."
      : "Migrate or license Exchange Online; Copilot Outlook features require cloud mailbox.",
  });

  const odOk = p.oneDrive === "yes";
  rows.push({
    requirement: "OneDrive for Business provisioned (file grounding & Microsoft Graph scope)",
    status: odOk ? "met" : p.oneDrive === "unknown" ? "partial" : "not_met",
    action_needed: odOk
      ? "Enforce known-folder move or redirect for key profiles so content is cloud-anchored."
      : "Enable OneDrive in the Microsoft 365 admin center and provision storage per user.",
  });

  rows.push({
    requirement:
      "Entra ID (Azure AD) identity for every user — no shadow local-only accounts for M365",
    status: p.entraPlan === "unknown" ? "partial" : "met",
    action_needed:
      "Microsoft 365 admin center → Users → Active users — ensure UPNs sync from Entra ID; eliminate shared generic accounts where possible.",
  });

  rows.push({
    requirement:
      "Microsoft Loop (recommended for Loop workspace Copilot scenarios)",
    status: p.loop === "yes" ? "met" : p.loop === "no" ? "partial" : "partial",
    action_needed:
      p.loop === "no"
        ? "Settings → Org settings → Microsoft Loop — enable for the tenant or scoped security groups per data boundary."
        : "Confirm Loop policy aligns with sensitivity label publication (labels should exist before wide Copilot + Loop).",
  });

  rows.push({
    requirement:
      "Sensitivity labels published (Microsoft Purview Information Protection)",
    status:
      p.sensitivityLabels === "org_wide"
        ? "met"
        : p.sensitivityLabels === "none"
          ? "not_met"
          : "partial",
    action_needed:
      "Microsoft Purview portal → Information protection → Labels — publish a minimal taxonomy (Public / Internal / Confidential / Highly Confidential) and auto-labeling pilots for regulated content.",
  });

  rows.push({
    requirement:
      "Restricted SharePoint Search or equivalent tenant hardening for regulated Copilot rollouts",
    status:
      p.restrictedSpSearch === "yes"
        ? "met"
        : p.restrictedSpSearch === "unknown"
          ? "partial"
          : "not_met",
    action_needed:
      "SharePoint admin center → Settings → Search → Restricted SharePoint Search — design with legal/compliance; pairs with explicit content governance.",
  });

  return rows;
}

function scorePrerequisiteHealth(
  rows: CopilotPrerequisiteRow[],
): Record<PrerequisiteStatus, number> {
  const acc: Record<PrerequisiteStatus, number> = {
    met: 0,
    partial: 0,
    not_met: 0,
  };
  for (const r of rows) {
    acc[r.status] += 1;
  }
  return acc;
}

function deriveCopilotReadiness(
  p: ParsedPosture,
  prereq: CopilotPrerequisiteRow[],
): CopilotReadinessStatus {
  const { not_met, partial, met } = scorePrerequisiteHealth(prereq);
  const baseBlocked = !qualifiesCopilotBaseLicense(p.licenseTier);

  if (baseBlocked || not_met >= 3) return "blocked";
  if (not_met >= 1 || partial >= 4) return "possible_with_upgrades";
  if (partial >= 1 || met < prereq.length) return "ready_with_gaps";
  return "ready";
}

// -----------------------------------------------------------------------------
// Compliance gaps (industry + posture)
// -----------------------------------------------------------------------------

function rem(
  what: string,
  path: string,
  effort: RemediationEffort,
  license: string | null,
  cost: string,
): GapRemediation {
  return {
    what_to_do: what,
    admin_center_path: path,
    effort,
    license_requirement: license,
    estimated_cost: cost,
  };
}

function hipaaGaps(p: ParsedPosture): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];
  if (p.baaExecuted !== "yes") {
    gaps.push({
      control: "HIPAA Business Associate Agreement (BAA)",
      industry_requirement:
        "Covered entities / business associates must have a executed BAA with subprocessors handling PHI (45 CFR §164.308(b)).",
      current_state:
        p.baaExecuted === "no"
          ? "No executed Microsoft BAA on file (self-reported)."
          : "BAA status not confirmed.",
      risk_level: "critical",
      remediation: rem(
        "Execute Microsoft's HIPAA BAA in the Microsoft 365 admin center and retain evidence in your compliance file.",
        "Microsoft 365 admin center → Settings → Org settings → Organization profile → Add BAA (HIPAA) — complete attestation wizard; download executed copy for your HIPAA documentation package.",
        "low",
        "None — BAA is contractual; included path for eligible commercial subscriptions.",
        "$0 (contract execution); legal review optional ($500–$2,500 typical small practice).",
      ),
    });
  }

  if (p.auditRetention !== "one_year_plus") {
    gaps.push({
      control: "Audit log retention for forensics & OCR readiness",
      industry_requirement:
        "HIPAA Security Rule expects audit controls and review (§164.312(b)); OCR investigations routinely request 12+ months of unified audit history.",
      current_state:
        p.auditRetention === "under_90"
          ? "Retention under 90 days (self-reported) — insufficient for many investigations."
          : "Audit retention not validated / likely default.",
      risk_level: "high",
      remediation: rem(
        "Extend Microsoft 365 unified audit log retention to 1 year (min) via Audit (Premium) or equivalent SKU; export critical subsets to SIEM.",
        "Microsoft Purview portal → Audit → Audit search — verify licensing; Microsoft 365 admin center → Compliance → Audit for legacy paths. Configure retention per Microsoft guidance for your SKU.",
        "medium",
        "Often requires Microsoft 365 E5 or E5 Compliance / Audit (Premium) add-on for 1-year default retention.",
        "Typically +$15–$35/user/month depending on bundle (E5 stack vs. add-on); exact quote from CSP.",
      ),
    });
  }

  if (p.dlp === "none" || p.dlp === "unknown") {
    gaps.push({
      control: "DLP policies for PHI in email & files",
      industry_requirement:
        "Reasonable safeguards for e-PHI including transmission security and access controls (§164.312).",
      current_state: "No org-wide DLP for Microsoft 365 workloads confirmed.",
      risk_level: "high",
      remediation: rem(
        "Deploy Microsoft Purview DLP policies for Teams, Exchange, SharePoint, and OneDrive; start with HIPAA template patterns (SSN, medical record numbers) and endpoint DLP where licensed.",
        "Microsoft Purview portal → Data loss prevention → Policies → Create policy — use HIPAA template; tune false positives in simulation mode first.",
        "high",
        "Business Premium: endpoint + basic DLP scenarios; E3+: full DLP for M365 services.",
        "Upgrade delta roughly $9–$15/user (Basic→Premium) or $20–$25/user (Std→E3) at typical CSP list bands — validate with reseller.",
      ),
    });
  }

  if (p.sensitivityLabels === "none" || p.sensitivityLabels === "unknown") {
    gaps.push({
      control: "Encryption & visual marking for patient-related documents",
      industry_requirement:
        "Access control + integrity for PHI; encryption at rest and in transit expected for cloud services.",
      current_state: "Sensitivity labels / RMS encryption not deployed org-wide.",
      risk_level: "medium",
      remediation: rem(
        "Publish sensitivity labels with encryption for a 'PHI — Minimum Necessary' label; tie to auto-labeling for medical record keywords.",
        "Microsoft Purview portal → Information protection → Labels — configure encryption settings; publish to all users.",
        "medium",
        "Business Premium or E3 minimum for full label publication to M365 apps.",
        "Included in Premium/E3; $0 incremental if already licensed.",
      ),
    });
  }

  return gaps;
}

function legalGaps(p: ParsedPosture): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  if (p.externalSharing === "open" || p.externalSharing === "unknown") {
    gaps.push({
      control: "External collaboration & ethical wall patterns",
      industry_requirement:
        "ABA Model Rule 1.6 and state bar ethics opinions require reasonable safeguards for client confidential information; many firms require information barriers between matters.",
      current_state:
        p.externalSharing === "open"
          ? "Self-reported open external sharing — high risk of inadvertent disclosure."
          : "External sharing posture not confirmed.",
      risk_level: p.externalSharing === "open" ? "critical" : "medium",
      remediation: rem(
        "Implement organization-wide external sharing restrictions (domain allow/deny lists), default anyone-links off, and sensitivity labels that block external access for 'Client Confidential' content.",
        "SharePoint admin center → Policies → Sharing — set to 'Existing guests only' or more restrictive; Microsoft Purview → Information protection → label policies blocking external.",
        "medium",
        "E3+ recommended for advanced label automation; P1 Conditional Access to enforce compliant devices.",
        "$0 policy work; Entra ID P1 ~$6/user list if not present.",
      ),
    });
  }

  if (
    p.sensitivityLabels === "none" ||
    p.sensitivityLabels === "unknown"
  ) {
    gaps.push({
      control: "Matter-centric sensitivity labels & ethical wall support",
      industry_requirement:
        "Document classification aligned to privilege and matter teams; restrict access via encryption + groups.",
      current_state: "No formal label taxonomy for privileged materials.",
      risk_level: "high",
      remediation: rem(
        "Create labels for Privileged / Work Product / Client Confidential; use auto-labeling with trainable classifiers (E5) or manual application (lower tiers).",
        "Microsoft Purview portal → Information protection → Labels & Trainable classifiers.",
        "high",
        "Trainable classifiers and advanced auto-labeling: E5 advantage; E3 can still manual + keyword.",
        "E5 uplift ~$20–$25/user vs E3 at typical list — confirm with licensing.",
      ),
    });
  }

  if (p.governanceForRegulated !== "formal_program" && !p.regulatedData.none) {
    gaps.push({
      control: "Insider risk monitoring for departing attorneys / staff",
      industry_requirement:
        "Obligations to detect unauthorized taking of client files; state bar opinions increasingly expect reasonable monitoring.",
      current_state: "No Insider Risk Management program confirmed.",
      risk_level: "medium",
      remediation: rem(
        "Pilot Insider Risk Management policies for unusual exfiltration (USB, personal cloud uploads) with HR/legal review.",
        "Microsoft Purview portal → Insider risk management → Policies.",
        "high",
        "Microsoft 365 E5 or Insider Risk add-on.",
        "Typically bundled in E5 (~$57/user list) vs add-on pricing — get CSP quote.",
      ),
    });
  }

  return gaps;
}

function insuranceGaps(p: ParsedPosture): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  gaps.push({
    control: "Producer & customer PII protection (state + NAIC model influences)",
    industry_requirement:
      "State insurance privacy laws and NAIC Insurance Data Security Model Law elements: access controls, audit trails, secure disposal, incident response.",
    current_state:
      p.dlp === "none"
        ? "DLP not deployed — limited ability to prevent bulk export of policyholder files."
        : "DLP maturity not validated.",
    risk_level: p.dlp === "none" ? "high" : "medium",
    remediation: rem(
      "Enable DLP for financial/PII patterns (SSN, bank account, policy numbers) across Exchange/OneDrive/Teams; pair with retention labels for policy records.",
      "Microsoft Purview → Data loss prevention → Policies — Financial U.S. templates as starting point.",
      "high",
      "Business Premium or E3 for service DLP; E5 for advanced investigation.",
      "See SKU upgrade rows in this report.",
    ),
  });

  if (p.auditRetention !== "one_year_plus") {
    gaps.push({
      control: "Audit trail retention for market conduct / disputes",
      industry_requirement:
        "Demonstrable access history for customer policy files during regulatory exams or coverage litigation.",
      current_state: "Audit retention under enterprise standard.",
      risk_level: "medium",
      remediation: rem(
        "Extend audit retention and enable Alert policies for risky sharing.",
        "Microsoft Purview → Audit; Defender portal → Email & collaboration alerts.",
        "medium",
        "Audit (Premium) / E5 features for extended retention.",
        "Budget $15–$35/user depending on path.",
      ),
    });
  }

  return gaps;
}

function oilGasGaps(p: ParsedPosture): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  gaps.push({
    control: "Export control & controlled technical data (ITAR/EAR) segmentation",
    industry_requirement:
      "If engineering drawings or dual-use technology are handled, U.S. export regulations may require access barriers and country-based restrictions.",
    current_state:
      "Tenant-wide Copilot / search may aggregate data across business units — risk if controlled data mixes with commercial.",
    risk_level: "high",
    remediation: rem(
      "Segment controlled data into separate Microsoft 365 tenants or use strict sensitivity labels + restricted search + network location policies; involve export counsel.",
      "Microsoft Purview → Information protection; SharePoint admin → Restricted SharePoint Search; Entra → Conditional Access named locations.",
      "high",
      "E5 / E5 Security for advanced automation; multi-tenant is a licensing + architecture decision.",
      "Architecture effort $25k–$100k+ typical SMB energy services; licenses per user as quoted.",
    ),
  });

  if (p.hybridIdentity === "yes") {
    gaps.push({
      control: "Hybrid identity hardening (AD Connect, PTA/ADFS, writeback)",
      industry_requirement:
        "SOC 2 / CFATS-style expectations for credential tier separation; OT networks must not share identity blast radius with IT.",
      current_state: "Hybrid identity in use — review sync account protection and emergency access.",
      risk_level: "medium",
      remediation: rem(
        "Harden Entra Connect / Cloud sync accounts, enable PHS or PTA with seamless SSO, deploy break-glass accounts with monitoring, separate Tier0.",
        "Entra admin center → Entra Connect → Health; use Securing privileged access playbook.",
        "high",
        "Entra ID P2 recommended for Identity Protection on hybrid users.",
        "P2 list ~$9/user; implementation services variable.",
      ),
    });
  }

  return gaps;
}

function generalGaps(p: ParsedPosture): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  if (p.securityTraining === "never" || p.securityTraining === "once") {
    gaps.push({
      control: "Security awareness cadence (SOC 2 CC1/CC2 alignment)",
      industry_requirement:
        "Demonstrated training and communication around phishing, data handling, and acceptable use.",
      current_state: "Training cadence below annual (self-reported).",
      risk_level: "medium",
      remediation: rem(
        "Launch Attack simulation training + mandatory Purview compliance courses quarterly.",
        "Microsoft 365 admin center → Reports → Usage → Microsoft 365 compliance score; Defender for Office 365 → Attack simulation training (if licensed).",
        "low",
        "Defender for Office 365 Plan 2 (phish sim) bundled in E5 / add-on.",
        "Plan 2 add-on roughly $2–$4/user (varies) — confirm pricing.",
      ),
    });
  }

  if (p.entraPlan === "free" || p.entraPlan === "unknown") {
    gaps.push({
      control: "Conditional Access & risk-based policies",
      industry_requirement:
        "SOC 2 CC6 — logical access; modern baseline is CA policies for MFA, compliant devices, and risky sign-ins.",
      current_state: "Entra ID P1/P2 capabilities not confirmed.",
      risk_level: "medium",
      remediation: rem(
        "Purchase Entra ID P1 minimum; implement CA policies: block legacy auth, require MFA, require compliant or hybrid Azure AD joined device for sensitive apps.",
        "Entra admin center → Protection → Conditional Access → Policies.",
        "medium",
        "Entra ID P1",
        "~$6/user/month list (Microsoft pricing — verify).",
      ),
    });
  }

  return gaps;
}

function buildComplianceGaps(
  industry: Industry,
  p: ParsedPosture,
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  if (industry === "dental" || industry === "healthcare_other") {
    gaps.push(...hipaaGaps(p));
  }
  if (industry === "legal") {
    gaps.push(...legalGaps(p));
  }
  if (industry === "insurance") {
    gaps.push(...insuranceGaps(p));
  }
  if (industry === "oil_gas") {
    gaps.push(...oilGasGaps(p));
  }

  gaps.push(...generalGaps(p));

  // De-dupe by control name
  const seen = new Set<string>();
  return gaps.filter((g) => {
    if (seen.has(g.control)) return false;
    seen.add(g.control);
    return true;
  });
}

// -----------------------------------------------------------------------------
// Recommended upgrades
// -----------------------------------------------------------------------------

function buildRecommendedUpgrades(p: ParsedPosture): RecommendedUpgrade[] {
  const out: RecommendedUpgrade[] = [];

  if (p.licenseTier === "microsoft_365_business_basic") {
    out.push({
      from_sku: "Microsoft 365 Business Basic",
      to_sku: "Microsoft 365 Business Standard",
      monthly_cost_per_user: 12.5,
      capabilities_unlocked: [
        "Desktop Office apps",
        "Copilot-qualified base SKU (still need $30 Copilot add-on)",
        "Exchange Online Plan 1 parity with business email standard",
      ],
      priority: "P0",
    });
  }

  if (
    p.licenseTier === "microsoft_365_business_standard" ||
    p.licenseTier === "microsoft_365_business_basic"
  ) {
    out.push({
      from_sku:
        p.licenseTier === "microsoft_365_business_basic"
          ? "Microsoft 365 Business Basic"
          : "Microsoft 365 Business Standard",
      to_sku: "Microsoft 365 Business Premium",
      monthly_cost_per_user: 10,
      capabilities_unlocked: [
        "Microsoft Purview Information Protection (sensitivity labels)",
        "Intune device management",
        "Defender for Office 365 Plan 1",
        "Azure Information Protection unified labeling client scenarios",
      ],
      priority: "P1",
    });
  }

  if (
    p.licenseTier === "microsoft_365_business_premium" ||
    p.licenseTier === "microsoft_365_business_standard"
  ) {
    out.push({
      from_sku: "Microsoft 365 Business Premium / Standard",
      to_sku: "Microsoft 365 E3",
      monthly_cost_per_user: 18,
      capabilities_unlocked: [
        "Enterprise-grade DLP across Exchange / OneDrive / SharePoint / Teams",
        "Full litigation hold & eDiscovery tooling baseline",
        "Advanced audit scenarios (with add-ons)",
      ],
      priority: "P2",
    });
  }

  if (p.licenseTier !== "microsoft_365_e5") {
    out.push({
      from_sku: "Current SKU",
      to_sku: "Microsoft 365 E5 (security + compliance stack)",
      monthly_cost_per_user: 22,
      capabilities_unlocked: [
        "Insider Risk Management",
        "Communication Compliance",
        "Advanced eDiscovery",
        "Defender for Cloud Apps (full CASB feature set)",
        "Longer default audit retention options (verify tenant settings)",
      ],
      priority: "P3",
    });
  }

  if (p.copilotAddOn !== "yes") {
    out.push({
      from_sku: "Base Microsoft 365",
      to_sku: "Copilot for Microsoft 365 add-on",
      monthly_cost_per_user: 30,
      capabilities_unlocked: [
        "Copilot in Teams, Word, Outlook, PowerPoint, Excel, Loop",
        "Microsoft Graph-grounded enterprise chat (where permitted by policy)",
      ],
      priority: "P0",
    });
  }

  if (p.entraPlan === "free" || p.entraPlan === "unknown") {
    out.push({
      from_sku: "Entra ID Free",
      to_sku: "Entra ID P1",
      monthly_cost_per_user: 6,
      capabilities_unlocked: [
        "Conditional Access",
        "Dynamic groups for scoped Copilot pilots",
        "SSPR writeback policies",
      ],
      priority: "P1",
    });
  }

  if (p.entraPlan === "p1" || p.entraPlan === "free" || p.entraPlan === "unknown") {
    out.push({
      from_sku: "Entra ID P1 / Free",
      to_sku: "Entra ID P2",
      monthly_cost_per_user: 9,
      capabilities_unlocked: [
        "Identity Protection risk-based policies",
        "Privileged Identity Management (just-in-time admin)",
      ],
      priority: "P2",
    });
  }

  return out;
}

// -----------------------------------------------------------------------------
// Quick wins (within current tier assumptions)
// -----------------------------------------------------------------------------

function buildQuickWins(p: ParsedPosture): QuickWin[] {
  const wins: QuickWin[] = [];

  wins.push({
    title: "Turn off anonymous sharing links by default",
    description:
      "Stops 'anyone with the link' sprawl — immediate reduction in accidental public exposure before labels land.",
    admin_center_path:
      "Microsoft 365 admin center → SharePoint → Policies → Sharing → set default link type to 'Specific people' and disable 'Anyone' links.",
    effort: "low",
  });

  wins.push({
    title: "Enable Security Defaults or baseline Conditional Access",
    description:
      "Universal MFA for all users; if P1 unavailable, Security Defaults is a 30-minute win (tradeoff: less granularity).",
    admin_center_path:
      "Entra admin center → Manage → Properties → Manage Security defaults = Yes; OR Conditional Access → Create policy 'Require MFA for all users'.",
    effort: "low",
  });

  if (p.sensitivityLabels === "none" || p.sensitivityLabels === "unknown") {
    wins.push({
      title: "Publish a single 'Confidential' sensitivity label (encryption off)",
      description:
        "Start minimal: visual marking + header/footer before encryption complexity — trains staff for Copilot rollout.",
      admin_center_path:
        "Microsoft Purview portal → Information protection → Labels → Create label → publish to all.",
      effort: "medium",
    });
  }

  wins.push({
    title: "Register for Microsoft Secure Score review cadence",
    description:
      "Gives leadership a measurable weekly metric without new SKU.",
    admin_center_path:
      "Microsoft 365 Defender portal → Microsoft Secure Score → assign owners to top recommendations.",
    effort: "low",
  });

  return wins;
}

// -----------------------------------------------------------------------------
// Roadmap
// -----------------------------------------------------------------------------

function buildRoadmap(
  p: ParsedPosture,
  industry: Industry,
  employeeBand: EmployeeCountRange,
): SecurityRoadmap {
  const band = estimatedUsersBand(employeeBand);
  const industryNote =
    industry === "dental" || industry === "healthcare_other"
      ? "Execute BAA + PHI label pilot."
      : industry === "legal"
        ? "Lock external sharing + privilege labels."
        : industry === "insurance"
          ? "PII DLP patterns + retention."
          : industry === "oil_gas"
            ? "Segment controlled technical data + hybrid IAM review."
            : "Baseline CA + Secure Score.";

  return {
    days_0_30: [
      `Inventory actual SKUs & Entra tier for ${band} users (Billing → Your products).`,
      industryNote,
      "Enable MFA for every admin; create two break-glass cloud-only accounts.",
      "Disable anonymous links; require explicit guest invitations.",
      "Start Copilot pilot charter only after labels + DLP simulation mode.",
    ],
    days_31_60: [
      "Deploy sensitivity labels to production + auto-label pilot on regulated libraries.",
      "Implement Conditional Access policies (managed devices or approved client apps) if P1 licensed.",
      "Turn on Restricted SharePoint Search evaluation for regulated sites.",
      "Run Copilot readiness workshop with legal/compliance sign-off.",
    ],
    days_61_90: [
      "Expand DLP from simulation to enforcement with business exception process.",
      p.licenseTier === "microsoft_365_e5"
        ? "Activate Insider Risk Management in simulation; integrate HR signals."
        : "Evaluate E5 or targeted compliance add-ons if audit retention / insider risk gaps remain.",
      "Establish quarterly access reviews for Microsoft 365 groups tied to sensitive labels.",
      "Document incident response playbooks for oversharing & Copilot prompt logging review.",
    ],
  };
}

function executiveSummary(
  p: ParsedPosture,
  readiness: CopilotReadinessStatus,
  industry: Industry,
): string[] {
  return [
    `Detected SKU posture: ${p.licenseTier.replace(/_/g, " ")} — ${purviewTierLabel(p.licenseTier)}`,
    `Entra ID: ${entraCapabilitySummary(p.entraPlan)}`,
    `Copilot readiness: ${readiness.replace(/_/g, " ")} — prerequisites must be green before spending on the $30/user add-on.`,
    industry === "dental" || industry === "healthcare_other"
      ? "HIPAA: BAA execution + DLP + labels are non-negotiable before Copilot touches clinical content."
      : industry === "legal"
        ? "Legal: external sharing and privilege labels matter more than the AI model — fix collaboration guardrails first."
        : industry === "insurance"
          ? "Insurance: pair Purview DLP with clear retention on policyholder correspondence."
          : industry === "oil_gas"
            ? "Energy: treat Copilot as a data aggregator — if ITAR/EAR applies, architect segmentation before rollout."
            : "General: Entra P1 + labels + DLP simulation is the modern SOC 2 technical baseline.",
  ];
}

// -----------------------------------------------------------------------------
// Copilot supplemental signals (from `copilot-supplemental.json` option `m365_signal`)
// -----------------------------------------------------------------------------

function toSelectedLabels(
  v: string | string[] | number | boolean | null | undefined,
): string[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map(String).filter((s) => s.length > 0);
  if (typeof v === "string") return v.length > 0 ? [v] : [];
  if (typeof v === "number" || typeof v === "boolean") return [String(v)];
  return [];
}

/**
 * Walks responses, resolves selected option `m365_signal` values from the
 * given question set (main bank and supplemental options may define signals).
 */
export function extractM365Signals(
  responses: AssessmentResponse,
  questionSet: readonly BankQuestion[],
): string[] {
  const out: string[] = [];
  for (const q of questionSet) {
    for (const label of toSelectedLabels(responses[q.id])) {
      const opt = q.options.find((o) => o.label === label);
      if (opt?.m365_signal) out.push(opt.m365_signal);
    }
  }
  return out;
}

function enrichM365ReportWithSignals(
  report: M365GapAnalysisReport,
  signals: string[],
): M365GapAnalysisReport {
  const s = new Set(signals);
  let {
    compliance_gaps,
    recommended_upgrades,
    quick_wins,
    executive_summary_bullets,
    copilot_relevance,
  } = report;

  if (s.has("not_m365_tenant")) {
    copilot_relevance = {
      status: "not_microsoft_365_tenant",
      message:
        "You indicated you don't use Microsoft 365. This Copilot Readiness path targets organizations on (or planning) Microsoft 365. Tulsa AI can still help with broader AI and automation strategy; Copilot-for-M365 licensing and tenant-specific security steps apply once you are on the platform.",
    };
    executive_summary_bullets = [
      "Not on Microsoft 365 today — the Copilot for Microsoft 365 product fit is limited until you have a tenant and qualifying base licenses.",
      ...executive_summary_bullets,
    ];
  }

  if (s.has("sharepoint_oversharing_critical") || s.has("sharepoint_unknown")) {
    const topGap: ComplianceGap = {
      control: "SharePoint / Microsoft 365 group oversharing (Copilot blast radius)",
      industry_requirement:
        "Copilot returns content the user can read. Unreviewed or org-wide ‘Everyone’ permissions directly expand what Copilot can surface.",
      current_state: s.has("sharepoint_oversharing_critical")
        ? "Self-reported: broad SharePoint permissions; oversharing risk is critical for Copilot rollout."
        : "Self-reported: SharePoint permissions are unknown; Copilot exposure cannot be bounded.",
      risk_level: "critical",
      remediation: rem(
        "Inventory sites and groups, remove org-wide 'Everyone' links except vetted communication sites, and re-scope permissions with business owners before expanding Copilot.",
        "SharePoint admin center and Microsoft Purview / SharePoint Advanced Management tools for permissions reporting.",
        "high",
        "SharePoint Advanced Management or equivalent for deep analytics on some paths.",
        "Scoping and tooling vary; budget workshops plus tooling with your CSP.",
      ),
    };
    if (!compliance_gaps.some((g) => g.control === topGap.control)) {
      compliance_gaps = [topGap, ...compliance_gaps];
    }
  }

  if (s.has("purview_not_deployed") || s.has("purview_unknown")) {
    const purviewUpgrade: RecommendedUpgrade = {
      from_sku: "Current M365 / SharePoint / OneDrive",
      to_sku: "Deploy Microsoft Purview sensitivity labels (org-wide plan)",
      monthly_cost_per_user: null,
      capabilities_unlocked: [
        "Classify and protect content so Copilot respects confidentiality boundaries",
        "Foundation for DLP, auto-labeling, and compliance reporting",
      ],
      priority: "P1",
    };
    if (
      !recommended_upgrades.some(
        (u) => u.to_sku === purviewUpgrade.to_sku,
      )
    ) {
      recommended_upgrades = [purviewUpgrade, ...recommended_upgrades];
    }
  }

  if (s.has("copilot_purchased_low_adoption")) {
    const win: QuickWin = {
      title: "Pause net-new Copilot seats until prerequisites are closed",
      description:
        "You reported purchased Copilot with low adoption. Address SharePoint permissions and labels before expanding assignments so Copilot does not scale exposure of sensitive content.",
      admin_center_path:
        "Microsoft 365 admin center → Billing → Licenses — hold additional Copilot assignments until readiness checkpoints pass.",
      effort: "medium",
    };
    if (!quick_wins.some((w) => w.title === win.title)) {
      quick_wins = [win, ...quick_wins];
    }
  }

  return {
    ...report,
    compliance_gaps,
    recommended_upgrades,
    quick_wins,
    executive_summary_bullets,
    ...(copilot_relevance ? { copilot_relevance } : {}),
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function buildM365GapAnalysisInput(
  responses: AssessmentResponse,
  industry: Industry,
  employeeCountRange: EmployeeCountRange,
): M365GapAnalysisInput {
  return {
    responses,
    industry,
    employeeCountRange,
    m365Signals: extractM365Signals(
      responses,
      loadCopilotSupplementalQuestions(),
    ),
  };
}

export function analyzeM365SecurityGaps(
  input: M365GapAnalysisInput,
): M365GapAnalysisReport {
  const p = parsePosture(input.responses);
  const copilot_prerequisites_status = buildCopilotPrerequisites(p);
  const copilot_readiness_status = deriveCopilotReadiness(
    p,
    copilot_prerequisites_status,
  );

  const compliance_gaps = buildComplianceGaps(input.industry, p);
  const recommended_upgrades = buildRecommendedUpgrades(p);
  const quick_wins = buildQuickWins(p);
  const security_roadmap = buildRoadmap(
    p,
    input.industry,
    input.employeeCountRange,
  );

  const base: M365GapAnalysisReport = {
    current_license_tier: p.licenseTier,
    copilot_readiness_status,
    copilot_prerequisites_status,
    compliance_gaps,
    recommended_upgrades,
    quick_wins,
    security_roadmap,
    executive_summary_bullets: executiveSummary(
      p,
      copilot_readiness_status,
      input.industry,
    ),
  };

  const signals =
    input.m365Signals ??
    extractM365Signals(
      input.responses,
      loadCopilotSupplementalQuestions(),
    );
  return enrichM365ReportWithSignals(base, signals);
}
