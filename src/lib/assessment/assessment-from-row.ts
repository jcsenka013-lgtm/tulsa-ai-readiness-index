import type {
  Assessment,
  AssessmentResponse,
  AssessmentStatus,
  Industry,
  EmployeeCountRange,
  ProductType,
  ReadinessTier,
  RecommendedNextStep,
} from "@/types/assessment";

/**
 * Maps a raw `assessments` row from PostgREST (snake_case) into the app
 * `Assessment` shape.
 */
export function assessmentFromRow(row: Record<string, unknown>): Assessment {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? ""),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    productType: (() => {
      const raw = row.product_type;
      if (raw === "copilot_readiness" || raw === "ai_readiness") {
        return raw as ProductType;
      }
      return "ai_readiness";
    })(),
    status: (row.status ?? "in_progress") as AssessmentStatus,
    email: row.email ? String(row.email) : null,
    fullName: row.full_name ? String(row.full_name) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    roleTitle: row.role_title ? String(row.role_title) : null,
    phone: row.phone ? String(row.phone) : null,
    industry: (row.industry ?? null) as Industry | null,
    employeeCountRange: (row.employee_count_range ?? null) as EmployeeCountRange | null,
    annualRevenueRange: row.annual_revenue_range
      ? String(row.annual_revenue_range)
      : null,
    responses: (row.responses ?? {}) as AssessmentResponse,
    dataSecurityComplianceScore:
      row.data_security_compliance_score != null
        ? Number(row.data_security_compliance_score)
        : null,
    operationalProcessMaturityScore:
      row.operational_process_maturity_score != null
        ? Number(row.operational_process_maturity_score)
        : null,
    technologyInfrastructureScore:
      row.technology_infrastructure_score != null
        ? Number(row.technology_infrastructure_score)
        : null,
    teamChangeManagementScore:
      row.team_change_management_score != null
        ? Number(row.team_change_management_score)
        : null,
    financialStrategicAlignmentScore:
      row.financial_strategic_alignment_score != null
        ? Number(row.financial_strategic_alignment_score)
        : null,
    overallScore:
      row.overall_score != null ? Number(row.overall_score) : null,
    readinessTier: (row.readiness_tier ?? null) as ReadinessTier | null,
    estimatedAnnualSavings:
      row.estimated_annual_savings != null
        ? Number(row.estimated_annual_savings)
        : null,
    estimatedPaybackMonths:
      row.estimated_payback_months != null
        ? Number(row.estimated_payback_months)
        : null,
    recommendedNextStep: (row.recommended_next_step ??
      null) as RecommendedNextStep | null,
    pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
    pdfDownloadCount: (() => {
      const n = Number(row.pdf_download_count ?? 0);
      return Number.isFinite(n) ? n : 0;
    })(),
    utmSource: row.utm_source ? String(row.utm_source) : null,
    utmMedium: row.utm_medium ? String(row.utm_medium) : null,
    utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
    bookedCallAt: row.booked_call_at ? String(row.booked_call_at) : null,
  };
}
