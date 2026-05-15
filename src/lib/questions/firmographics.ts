/**
 * Firmographic intake questions.
 *
 * These are the non-scoring questions we collect alongside the readiness
 * bank. Some (industry, employee_count_range, annual_revenue_range) are
 * persisted to dedicated columns on `assessments`; `hours_per_week_repetitive`
 * is stored in the `responses` JSONB and consumed by the ROI engine.
 *
 * Kept separate from `questions.json` so the scoring bank stays purely
 * about readiness signal and the intake form stays purely about
 * demographics + ROI inputs.
 */

import type {
  EmployeeCountRange,
  Industry,
} from "@/types/assessment";

export type HoursPerWeekRepetitive =
  | "under_10"
  | "10_25"
  | "25_50"
  | "50_100"
  | "over_100";

export type AnnualRevenueRange =
  | "under_500k"
  | "500k_1m"
  | "1m_5m"
  | "5m_25m"
  | "25m_100m"
  | "over_100m";

interface FirmographicOption<T extends string> {
  value: T;
  label: string;
}

interface FirmographicQuestion<T extends string> {
  id: string;
  prompt: string;
  helpText?: string;
  options: readonly FirmographicOption<T>[];
}

export const INDUSTRY_QUESTION: FirmographicQuestion<Industry> = {
  id: "industry",
  prompt: "Which best describes your business?",
  options: [
    { value: "dental", label: "Dental / orthodontics" },
    { value: "insurance", label: "Insurance agency / brokerage" },
    { value: "oil_gas", label: "Oil & gas / energy services" },
    { value: "legal", label: "Legal / law firm" },
    { value: "professional_services", label: "Professional services (consulting, accounting, etc.)" },
    { value: "healthcare_other", label: "Healthcare (non-dental)" },
    { value: "other", label: "Something else" },
  ],
};

export const EMPLOYEE_COUNT_QUESTION: FirmographicQuestion<EmployeeCountRange> = {
  id: "employee_count_range",
  prompt: "How many full-time employees does your business have?",
  options: [
    { value: "1-5", label: "1 – 5" },
    { value: "6-20", label: "6 – 20" },
    { value: "21-50", label: "21 – 50" },
    { value: "51-100", label: "51 – 100" },
    { value: "100+", label: "100+" },
  ],
};

export const ANNUAL_REVENUE_QUESTION: FirmographicQuestion<AnnualRevenueRange> = {
  id: "annual_revenue_range",
  prompt: "What is your approximate annual revenue?",
  options: [
    { value: "under_500k", label: "Under $500K" },
    { value: "500k_1m", label: "$500K – $1M" },
    { value: "1m_5m", label: "$1M – $5M" },
    { value: "5m_25m", label: "$5M – $25M" },
    { value: "25m_100m", label: "$25M – $100M" },
    { value: "over_100m", label: "Over $100M" },
  ],
};

/**
 * Hours-per-week of repetitive admin work — consumed by the ROI calculator.
 * Stored in `responses["hours_per_week_repetitive"]`.
 */
export const HOURS_PER_WEEK_QUESTION: FirmographicQuestion<HoursPerWeekRepetitive> = {
  id: "hours_per_week_repetitive",
  prompt: "How many hours per week does your team collectively spend on repetitive administrative work?",
  helpText: "Data entry, copy/paste between systems, status emails, follow-ups, manual reports.",
  options: [
    { value: "under_10", label: "Under 10 hours" },
    { value: "10_25", label: "10 – 25 hours" },
    { value: "25_50", label: "25 – 50 hours" },
    { value: "50_100", label: "50 – 100 hours" },
    { value: "over_100", label: "Over 100 hours" },
  ],
};

export const FIRMOGRAPHIC_QUESTIONS = [
  INDUSTRY_QUESTION,
  EMPLOYEE_COUNT_QUESTION,
  ANNUAL_REVENUE_QUESTION,
  HOURS_PER_WEEK_QUESTION,
] as const;

/** Role for `assessments.role_title` (free text in DB, constrained options in UI). */
export const ROLE_TITLE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "owner_president", label: "Owner / President" },
  { value: "c_suite", label: "C-level executive" },
  { value: "operations", label: "Operations / general manager" },
  { value: "it", label: "IT / technology lead" },
  { value: "finance", label: "Finance / office manager" },
  { value: "other", label: "Other" },
] as const;

/**
 * Inputs the ROI engine expects. May be partially null if the user hasn't
 * completed the intake yet — the calculator returns safe defaults.
 */
export interface FirmographicInputs {
  industry: Industry | null;
  employeeCountRange: EmployeeCountRange | null;
  annualRevenueRange: AnnualRevenueRange | null;
  hoursPerWeekRepetitive: HoursPerWeekRepetitive | null;
}
