import type { AssessmentResponse } from "@/types/assessment";

/**
 * Mid-sized dental practice, exploration tier (~55), mix of M365 strength and gaps.
 * Computed against the live scoring + M365 engines for the sample report page.
 */
export const SAMPLE_DENTAL_RESPONSES: AssessmentResponse = {
  ds_license_tier: "Microsoft 365 Business Premium",
  ds_mfa_coverage: "All users are required to use MFA",
  ds_sensitivity_labels: "Not deployed / not familiar",
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
  op_process_documentation: "Nothing written down — lives in people's heads",
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
  tech_endpoint_management: "Not managed — users own their devices and configuration",
  tech_backup_dr: "Cloud backup with periodic restore testing",
  tech_identity_provider: "Entra ID (Azure AD) for M365 plus some SSO",
  tech_data_warehouse: "Some reporting databases",
  tech_shadow_ai: "Policy communicated but not enforced",

  team_tech_lead: "Office manager / ops lead handles it alongside other duties",
  team_leadership_stance: "Skeptical — concerned about risk and cost",
  team_staff_comfort: "Mixed — some champions, some laggards",
  team_prior_rollouts: "Mixed — some stuck, some didn't",
  team_training_cadence: "Annual compliance training only",
  team_ai_policy: "Draft policy exists, not yet rolled out",
  team_resistance: ["None of the above"],
  team_champion_available: "Yes — one clear champion identified",

  fin_annual_revenue: "$3M – $10M",
  fin_timeline: "Just exploring / no timeline",
  fin_tech_budget: "$50K – $150K",
  fin_decision_speed: "Partnership / 2-3 principals",
  fin_strategic_priorities: ["No clear priorities yet"],
  fin_prior_ai_spend: "Tried free ChatGPT-class tools informally",
  fin_roi_expectation: "2x – 3x return on the investment",
  fin_measurement_willingness: "No — not willing to slow down for that",

  industry: "dental",
  employee_count_range: "21-50",
  annual_revenue_range: "1m_5m",
  hours_per_week_repetitive: "25_50",

  m365_copilot_add_on: "no",
  m365_sensitivity_labels: "pilot",
  m365_dlp: "standard",
  m365_audit_retention: "90_days",
  m365_baa_status: "executed",
};

export const SAMPLE_DENTAL_COMPANY = {
  companyName: "Sample Dental Practice",
  contactName: "Sample Practice Manager",
  roleTitle: "Office Manager",
  city: "Tulsa",
  state: "Oklahoma",
} as const;
