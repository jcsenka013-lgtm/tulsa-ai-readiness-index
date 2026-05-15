/**
 * Tulsa AI Readiness Index — domain types.
 *
 * These mirror the schema defined in
 * `supabase/migrations/001_initial_schema.sql` (updated in
 * `002_align_scoring_domains.sql`). Keep them in sync whenever the
 * schema changes.
 */

// -----------------------------------------------------------------------------
// Enumerations (string-literal unions, not TS `enum` — these serialize to
// plain strings in the database and over the wire).
// -----------------------------------------------------------------------------

export type AssessmentStatus =
  | "in_progress"
  | "completed"
  | "abandoned";

export type Industry =
  | "dental"
  | "insurance"
  | "oil_gas"
  | "legal"
  | "professional_services"
  | "healthcare_other"
  | "other";

export type EmployeeCountRange =
  | "1-5"
  | "6-20"
  | "21-50"
  | "51-100"
  | "100+";

export type ReadinessTier =
  | "foundation"
  | "exploration"
  | "pilot"
  | "scale";

export type RecommendedNextStep =
  | "audit"
  | "pilot"
  | "retainer"
  | "foundation_work";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "disqualified"
  | "booked"
  | "customer";

export type ProductType = "ai_readiness" | "copilot_readiness";

// -----------------------------------------------------------------------------
// Responses — the shape of the `assessments.responses` JSONB column.
//
// Questions are keyed by stable string ids (see `src/lib/questions`). A
// single answer can be a string, number, boolean, or an array of strings
// (multi-select). We keep this intentionally permissive so the scoring
// layer — not the type system — owns the validation of individual answers.
// -----------------------------------------------------------------------------

export type AssessmentAnswer = string | number | boolean | string[];

export type AssessmentResponse = Record<string, AssessmentAnswer>;

// -----------------------------------------------------------------------------
// Score breakdown across the five scoring domains defined in
// `src/lib/questions/questions.json`. See that file for the authoritative
// domain weights and tier thresholds.
// -----------------------------------------------------------------------------

export interface DomainScores {
  dataSecurityCompliance: number;
  operationalProcessMaturity: number;
  technologyInfrastructure: number;
  teamChangeManagement: number;
  financialStrategicAlignment: number;
}

export interface ScoreBreakdown extends DomainScores {
  overall: number;
}

// -----------------------------------------------------------------------------
// ROI projection computed from responses + firmographic intake. The
// persisted shape is simpler (single annual savings + payback) while the
// in-memory shape (see `src/lib/scoring`) includes full low/high bands.
// -----------------------------------------------------------------------------

export interface RoiProjection {
  estimatedAnnualSavings: number;
  estimatedPaybackMonths: number;
  recommendedNextStep: RecommendedNextStep;
}

// -----------------------------------------------------------------------------
// Attribution captured from UTM params on the landing page.
// -----------------------------------------------------------------------------

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

// -----------------------------------------------------------------------------
// Full assessment row (camelCase app-side shape).
//
// Note: rows returned from supabase-js use snake_case column names as-is.
// Adapt between the two shapes at the data-access boundary.
// -----------------------------------------------------------------------------

export interface Assessment {
  id: string;
  createdAt: string;
  completedAt: string | null;

  productType: ProductType;

  status: AssessmentStatus;

  email: string | null;
  fullName: string | null;
  companyName: string | null;
  roleTitle: string | null;
  phone: string | null;

  industry: Industry | null;
  employeeCountRange: EmployeeCountRange | null;
  annualRevenueRange: string | null;

  responses: AssessmentResponse;

  dataSecurityComplianceScore: number | null;
  operationalProcessMaturityScore: number | null;
  technologyInfrastructureScore: number | null;
  teamChangeManagementScore: number | null;
  financialStrategicAlignmentScore: number | null;
  overallScore: number | null;

  readinessTier: ReadinessTier | null;

  estimatedAnnualSavings: number | null;
  estimatedPaybackMonths: number | null;
  recommendedNextStep: RecommendedNextStep | null;

  pdfUrl: string | null;

  /** Incremented when GET /api/assessment/[id]/pdf issues a signed download URL. */
  pdfDownloadCount: number;

  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;

  bookedCallAt: string | null;
}

// -----------------------------------------------------------------------------
// Lead row.
// -----------------------------------------------------------------------------

export interface Lead {
  id: string;
  assessmentId: string | null;
  sourceProduct: ProductType | null;
  email: string;
  fullName: string | null;
  companyName: string | null;
  phone: string | null;
  createdAt: string;
  contactedAt: string | null;
  status: LeadStatus;
  notes: string | null;
}
