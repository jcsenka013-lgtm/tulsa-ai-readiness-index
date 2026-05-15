import type { AssessmentResponse } from "@/types/assessment";

/**
 * Mid-sized insurance agency, exploration tier, Copilot seats purchased with
 * weak M365 foundation. Drives `copilot-bought-foundation` + SharePoint
 * blast-radius insights from the live rules engine.
 */
export const SAMPLE_COPILOT_INSURANCE_RESPONSES: AssessmentResponse = {
  ds_license_tier: "Microsoft 365 Business Premium",
  ds_mfa_coverage: "All users are required to use MFA",
  ds_sensitivity_labels: "Not deployed / not familiar",
  ds_dlp_coverage: "Policies covering email only, SharePoint/OneDrive not covered",
  ds_information_protection: "No scanning — we rely on user judgment",
  ds_defender_cloud_apps: ["Defender for Office 365 (email)"],
  ds_conditional_access: "MFA for admins only; standard users optional",
  ds_external_sharing: "Guest access allowed broadly",
  ds_audit_retention: "Default / under 90 days",
  ds_compliance_requirements: ["State insurance regulations / NAIC data standards"],
  ds_data_residency: "Primarily cloud (M365, SharePoint, OneDrive)",
  ds_dpa_in_place: "DPAs/BAAs for all major vendors",

  op_time_consuming_processes: [
    "Policy documents, endorsements, and renewals",
    "Claims correspondence and status updates",
  ],
  op_document_volume: "100 – 500/week",
  op_email_volume: "150 – 400",
  op_reporting_cadence: "Mostly manual with a few saved templates",
  op_process_documentation: "A few critical SOPs exist, most do not",
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
  tech_endpoint_management: "Partial — some devices enrolled, gaps remain",
  tech_backup_dr: "Cloud backup with periodic restore testing",
  tech_identity_provider: "Entra ID (Azure AD) for M365 plus some SSO",
  tech_data_warehouse: "Some reporting databases",
  tech_shadow_ai: "Policy communicated but not enforced",

  team_tech_lead: "Office manager / ops lead handles it alongside other duties",
  team_leadership_stance: "Cautiously interested — wants proof points first",
  team_staff_comfort: "Mixed — some champions, some laggards",
  team_prior_rollouts: "Mixed — some stuck, some didn't",
  team_training_cadence: "Annual compliance training only",
  team_ai_policy: "Draft policy exists, not yet rolled out",
  team_resistance: ["None of the above"],
  team_champion_available: "Yes — one clear champion identified",

  fin_annual_revenue: "$3M – $10M",
  fin_timeline: "Actively evaluating vendors / solutions in the next quarter",
  fin_tech_budget: "$50K – $150K",
  fin_decision_speed: "Partnership / 2-3 principals",
  fin_strategic_priorities: ["Modernize client experience", "Reduce operational drag"],
  fin_prior_ai_spend: "Tried free ChatGPT-class tools informally",
  fin_roi_expectation: "2x – 3x return on the investment",
  fin_measurement_willingness: "Yes — if it doesn't slow us down much",

  industry: "insurance",
  employee_count_range: "21-50",
  annual_revenue_range: "1m_5m",
  hours_per_week_repetitive: "25_50",

  m365_copilot_add_on: "yes",
  m365_sensitivity_labels: "none",
  m365_dlp: "basic",
  m365_audit_retention: "under_90",
  m365_baa_status: "executed",

  COPILOT_LICENSE: "We've purchased seats but adoption is low",
  COPILOT_INTENT: "Clear use cases — we know exactly what we want it to do",
  SHAREPOINT_OVERSHARING: "I don't know what SharePoint is",
  SENSITIVITY_LABELS: "No, we've never set these up",
  DATA_HYGIENE_CADENCE: "Some parts are clean, others are a mess",
};

export const SAMPLE_COPILOT_INSURANCE_COMPANY = {
  companyName: "Sample Regional Insurance Agency",
  contactName: "Jordan Mercer",
  roleTitle: "Director of Operations",
  city: "Oklahoma City",
  state: "Oklahoma",
} as const;
