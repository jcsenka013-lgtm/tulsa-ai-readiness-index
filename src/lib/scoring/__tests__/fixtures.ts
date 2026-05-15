/**
 * Test fixtures — representative response sets at low, medium, and high
 * readiness. Values reference concrete option labels from
 * `src/lib/questions/questions.json` so the tests double as regression
 * checks on the bank labels.
 */

import type { AssessmentResponse } from "@/types/assessment";

/**
 * Low readiness — no controls, paper-based, skeptical leadership.
 * Expected tier: `foundation` (0-39 band).
 */
export const LOW_RESPONSES: AssessmentResponse = {
  // Data Security & Compliance
  ds_license_tier: "No Microsoft 365 / we use Google Workspace or other",
  ds_mfa_coverage: "No one / MFA is not enforced",
  ds_sensitivity_labels: "Not deployed / not familiar",
  ds_dlp_coverage: "No DLP policies configured",
  ds_information_protection: "No classification — we don't know what we have or where",
  ds_defender_cloud_apps: ["None"],
  ds_conditional_access: "None / not using Conditional Access",
  ds_external_sharing: "Anyone-with-link sharing allowed by default",
  ds_audit_retention: "No audit logging enabled / unknown",
  ds_compliance_requirements: ["HIPAA (patient health information)"],
  ds_data_residency: "Entirely on-premise / local file servers",
  ds_dpa_in_place: "None in place / never checked",

  // Operational Process Maturity
  op_time_consuming_processes: ["None of the above"],
  op_document_volume: "Fewer than 25/week",
  op_email_volume: "Under 50",
  op_reporting_cadence: "No regular reporting",
  op_process_documentation: "Nothing written down — lives in people's heads",
  op_tool_sprawl: "More than 25",
  op_handoff_quality: "Frequent drops, rework, and missed items",
  op_data_capture_digital: "Mostly paper, faxes, and phone calls",
  op_quality_metrics: "No metrics tracked",
  op_rework_rate: "More than 20%",

  // Technology Infrastructure
  tech_productivity_suite: "Other / not sure",
  tech_lob_software: "No dedicated LOB — we run on Excel / Sheets",
  tech_integration_platform: ["None — nothing is integrated"],
  tech_on_prem_infra: "Significant on-prem — domain controller, file server, app servers",
  tech_network_readiness: "Limited bandwidth, office-only access",
  tech_endpoint_management: "Not managed — users own their devices and configuration",
  tech_backup_dr: "No formal backups / unsure",
  tech_identity_provider: "Per-app local accounts, no central identity",
  tech_data_warehouse: "No — data lives in source systems only",
  tech_shadow_ai: "No idea — we don't monitor it",

  // Team & Change Management
  team_tech_lead: "No one specific — owner / partners handle it ad-hoc",
  team_leadership_stance: "Skeptical — concerned about risk and cost",
  team_staff_comfort: "Very resistant — adoption is always a struggle",
  team_prior_rollouts: "Rollouts routinely stall or roll back",
  team_training_cadence: "No formal training",
  team_ai_policy: "No — never discussed",
  team_resistance: ["Long-tenured staff resistant to change"],
  team_champion_available: "No one in particular",

  // Financial & Strategic Alignment
  fin_annual_revenue: "Under $1M",
  fin_timeline: "Just exploring / no timeline",
  fin_tech_budget: "Under $10K / year",
  fin_decision_speed: "Board approval required",
  fin_strategic_priorities: ["No clear priorities yet"],
  fin_prior_ai_spend: "Never",
  fin_roi_expectation: "No specific expectation — just exploring",
  fin_measurement_willingness: "No — not willing to slow down for that",

  // Firmographics
  industry: "dental",
  employee_count_range: "6-20",
  annual_revenue_range: "500k_1m",
  hours_per_week_repetitive: "25_50",
};

/**
 * Medium readiness — a real M365 tenant, MFA for everyone, some process
 * discipline, cautious but open leadership.
 * Expected tier: `exploration` or low `pilot` (40-70ish).
 */
export const MEDIUM_RESPONSES: AssessmentResponse = {
  ds_license_tier: "Microsoft 365 Business Premium",
  ds_mfa_coverage: "All users are required to use MFA",
  ds_sensitivity_labels: "Manual labeling in use, training delivered",
  ds_dlp_coverage: "Policies covering email + OneDrive/SharePoint, some in enforce mode",
  ds_information_protection: "Some scanning via Purview or a third-party tool",
  ds_defender_cloud_apps: [
    "Defender for Office 365 (email)",
    "Defender for Endpoint (devices)",
  ],
  ds_conditional_access: "Block legacy auth + MFA for all users",
  ds_external_sharing: "Guest access restricted, sharing limited to specific domains",
  ds_audit_retention: "1-year retention via E5 / add-on",
  ds_compliance_requirements: ["HIPAA (patient health information)"],
  ds_data_residency: "Primarily cloud (M365, SharePoint, OneDrive)",
  ds_dpa_in_place: "DPAs/BAAs for all major vendors",

  op_time_consuming_processes: [
    "Scheduling, confirmations, and reminder calls",
    "Chart / case / file notes drafting",
    "Intake forms and new-client onboarding",
  ],
  op_document_volume: "100 – 500/week",
  op_email_volume: "150 – 400",
  op_reporting_cadence: "Mostly manual with a few saved templates",
  op_process_documentation: "Core processes documented but outdated",
  op_tool_sprawl: "9 – 15",
  op_handoff_quality: "Handoffs defined but inconsistently followed",
  op_data_capture_digital: "Primarily digital but unstructured (email, PDFs)",
  op_quality_metrics: "Monthly reports reviewed",
  op_rework_rate: "10 – 20%",

  tech_productivity_suite: "Microsoft 365 (Outlook, Teams, SharePoint)",
  tech_lob_software: "Cloud-hosted LOB, limited integrations",
  tech_integration_platform: ["Native integrations inside our LOB only"],
  tech_on_prem_infra: "Hybrid — most cloud, some on-prem",
  tech_network_readiness: "Modern SSO + cloud apps accessible from anywhere",
  tech_endpoint_management: "Intune or similar MDM deployed, partial coverage",
  tech_backup_dr: "Cloud backup with periodic restore testing",
  tech_identity_provider: "Entra ID (Azure AD) for M365 plus some SSO",
  tech_data_warehouse: "Some reporting databases",
  tech_shadow_ai: "Policy communicated but not enforced",

  team_tech_lead: "Office manager / ops lead handles it alongside other duties",
  team_leadership_stance: "Cautious but open to structured pilots",
  team_staff_comfort: "Mixed — some champions, some laggards",
  team_prior_rollouts: "Mixed — some stuck, some didn't",
  team_training_cadence: "Annual compliance training only",
  team_ai_policy: "Draft policy exists, not yet rolled out",
  team_resistance: ["None of the above"],
  team_champion_available: "Yes — one clear champion identified",

  fin_annual_revenue: "$3M – $10M",
  fin_timeline: "Within the next 12 months",
  fin_tech_budget: "$50K – $150K",
  fin_decision_speed: "Partnership / 2-3 principals",
  fin_strategic_priorities: ["Reduce operating cost", "Retain staff / reduce burnout"],
  fin_prior_ai_spend: "Tried free ChatGPT-class tools informally",
  fin_roi_expectation: "2x – 3x return on the investment",
  fin_measurement_willingness: "Yes — we already track some of these metrics",

  industry: "dental",
  employee_count_range: "21-50",
  annual_revenue_range: "1m_5m",
  hours_per_week_repetitive: "25_50",
};

/**
 * High readiness — mature M365 E5, Zero Trust, automated workflows,
 * champion leadership.
 * Expected tier: `scale` (80-100 band).
 */
export const HIGH_RESPONSES: AssessmentResponse = {
  ds_license_tier: "Microsoft 365 E5 (includes advanced Purview + Defender)",
  ds_mfa_coverage: "All users on MFA plus phishing-resistant methods (FIDO2 / Authenticator number matching)",
  ds_sensitivity_labels: "Auto-labeling + encryption + DLP integration across all locations",
  ds_dlp_coverage: "Adaptive DLP tuned with industry-specific classifiers and regular policy review",
  ds_information_protection: "Automated classification + data-map dashboards reviewed quarterly",
  ds_defender_cloud_apps: ["Microsoft 365 Defender XDR — fully integrated"],
  ds_conditional_access: "Zero Trust model — identity + device + app + session controls",
  ds_external_sharing: "Fully governed — entitlement management + access reviews + expiration",
  ds_audit_retention: "SIEM export + 7-year retention for regulated data",
  ds_compliance_requirements: [
    "HIPAA (patient health information)",
    "SOC 2 obligations to customers",
  ],
  ds_data_residency: "Cloud-native with documented residency controls",
  ds_dpa_in_place: "Formal vendor-risk program with tiering",

  op_time_consuming_processes: ["Document review, summarization, or redlining"],
  op_document_volume: "More than 2,000/week",
  op_email_volume: "Over 1,000",
  op_reporting_cadence: "Fully automated dashboards with drill-down",
  op_process_documentation: "SOPs versioned, tested, and continuously improved",
  op_tool_sprawl: "4 – 8",
  op_handoff_quality: "Automated workflow with status visibility end-to-end",
  op_data_capture_digital: "Fully digital and API-accessible",
  op_quality_metrics: "Real-time ops dashboards with thresholds",
  op_rework_rate: "Under 2% (mature ops)",

  tech_productivity_suite: "Microsoft 365 (Outlook, Teams, SharePoint)",
  tech_lob_software: "API-first platform with active integrations already running",
  tech_integration_platform: ["Microsoft Power Automate / Power Apps"],
  tech_on_prem_infra: "Entirely cloud — no physical servers",
  tech_network_readiness: "Zero Trust network access with device posture checks",
  tech_endpoint_management: "Autopilot + compliance + conditional access fully integrated",
  tech_backup_dr: "3-2-1 with documented RPO/RTO and quarterly test restores",
  tech_identity_provider: "Entra ID with SSO to most business apps",
  tech_data_warehouse: "Microsoft Fabric, Snowflake, or similar modern lakehouse",
  tech_shadow_ai: "Sanctioned-AI list enforced, shadow AI blocked or redirected",

  team_tech_lead: "Dedicated IT / digital leader with budget authority",
  team_leadership_stance: "Champion — has set explicit AI strategy and budget",
  team_staff_comfort: "Tech-forward culture — adopts rapidly",
  team_prior_rollouts: "Repeated successful change initiatives",
  team_training_cadence: "Continuous learning culture with dedicated budget",
  team_ai_policy: "Policy, training, and enforcement via DLP / Purview",
  team_resistance: ["None of the above"],
  team_champion_available: "Multiple champions across departments",

  fin_annual_revenue: "Over $25M",
  fin_timeline: "Already investing — need help accelerating",
  fin_tech_budget: "Over $500K",
  fin_decision_speed: "Single owner decides — can move in days",
  fin_strategic_priorities: ["Revenue growth / new clients", "Keep up with competitors already using AI"],
  fin_prior_ai_spend: "Multiple AI tools in production, measurable ROI",
  fin_roi_expectation: "Cost savings of a specific headcount or $ amount",
  fin_measurement_willingness: "Absolutely — we want clear before/after data",

  industry: "legal",
  employee_count_range: "51-100",
  annual_revenue_range: "25m_100m",
  hours_per_week_repetitive: "50_100",
};

/**
 * Full Copilot supplemental answers on a low main-bank baseline (so
 * `data_security_compliance` stays low for Copilot+security insight tests).
 * Labels match `copilot-supplemental.json`.
 */
export const COPILOT_FLOW_RESPONSES: AssessmentResponse = {
  ...LOW_RESPONSES,
  COPILOT_LICENSE: "We've purchased seats but adoption is low",
  COPILOT_INTENT: "Microsoft rep is pushing us",
  SHAREPOINT_OVERSHARING: "I don't know what SharePoint is",
  SENSITIVITY_LABELS: "No, we've never set these up",
  DATA_HYGIENE_CADENCE: "Some parts are clean, others are a mess",
};
