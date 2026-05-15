/**
 * ROI calculator for the Tulsa AI Readiness Index.
 *
 * Takes a respondent's answers + firmographics and produces a ranged ROI
 * projection — labour-cost baseline, automation potential low/high, the
 * recommended investment range for their tier, payback window, and
 * first-year net savings. Every intermediate value is returned in
 * `inputsUsed` so the report can show its work.
 *
 * Benchmark rationale: the 40-65% automation band reflects what current
 * LLM + RPA stacks reliably automate of _truly_ repetitive office work.
 * Keep the report copy conservative; over-promising is the fastest way
 * to burn trust with operators in these industries.
 */

import type {
  AnnualRevenueRange,
  FirmographicInputs,
  HoursPerWeekRepetitive,
} from "@/lib/questions/firmographics";
import type {
  AssessmentResponse,
  EmployeeCountRange,
  Industry,
  ReadinessTier,
} from "@/types/assessment";
import {
  calculateDimensionScores,
  calculateOverallScore,
  determineReadinessTier,
} from "./calculateScores";

// -----------------------------------------------------------------------------
// Benchmark tables
// -----------------------------------------------------------------------------

const EMPLOYEE_COUNT_MIDPOINTS: Record<EmployeeCountRange, number> = {
  "1-5": 3,
  "6-20": 12,
  "21-50": 35,
  "51-100": 75,
  "100+": 150,
};

const HOURS_PER_WEEK_MIDPOINTS: Record<HoursPerWeekRepetitive, number> = {
  under_10: 5,
  "10_25": 17,
  "25_50": 37,
  "50_100": 75,
  over_100: 150,
};

const ANNUAL_REVENUE_MIDPOINTS: Record<AnnualRevenueRange, number> = {
  under_500k: 250_000,
  "500k_1m": 750_000,
  "1m_5m": 3_000_000,
  "5m_25m": 15_000_000,
  "25m_100m": 62_500_000,
  over_100m: 150_000_000,
};

/**
 * Loaded hourly cost by industry — salary + benefits + overhead. These are
 * Tulsa-area SMB benchmarks, intentionally a bit conservative.
 */
const INDUSTRY_LOADED_HOURLY_COST: Record<Industry, number> = {
  dental: 35,
  insurance: 40,
  oil_gas: 55,
  legal: 60,
  professional_services: 45,
  healthcare_other: 38,
  other: 40,
};

const INVESTMENT_BY_TIER: Record<
  ReadinessTier,
  { low: number; high: number }
> = {
  foundation: { low: 5_000, high: 12_000 },
  exploration: { low: 2_500, high: 2_500 },
  pilot: { low: 12_000, high: 25_000 },
  scale: { low: 30_000, high: 90_000 },
};

/** Sensible fallback industry when the intake field is blank. */
const DEFAULT_INDUSTRY: Industry = "other";

/**
 * Conservative fallback when hours/week is blank: assume a solid chunk of
 * repetitive work (17 hrs/week) so the ROI still renders meaningfully
 * rather than coming back as all zeros.
 */
const DEFAULT_HOURS_PER_WEEK: HoursPerWeekRepetitive = "10_25";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ROIInputsUsed {
  industry: Industry;
  /** `true` when we fell back to the default industry. */
  industryDefaulted: boolean;
  loadedHourlyCost: number;

  employeeCountRange: EmployeeCountRange | null;
  avgEmployeeCount: number | null;

  annualRevenueRange: AnnualRevenueRange | null;
  annualRevenueMidpoint: number | null;

  hoursPerWeekRange: HoursPerWeekRepetitive;
  /** `true` when we fell back to the default hours/week bucket. */
  hoursPerWeekDefaulted: boolean;
  hoursPerWeekMidpoint: number;

  tier: ReadinessTier;
}

export interface ROIEstimate {
  inputsUsed: ROIInputsUsed;

  annualLaborCost: number;
  automationPotentialLow: number;
  automationPotentialHigh: number;

  recommendedInvestmentLow: number;
  recommendedInvestmentHigh: number;

  paybackMonthsLow: number;
  paybackMonthsHigh: number;

  firstYearNetSavingsLow: number;
  firstYearNetSavingsHigh: number;
}

// -----------------------------------------------------------------------------
// Input extraction
// -----------------------------------------------------------------------------

function getString(
  responses: AssessmentResponse,
  key: string,
): string | null {
  const v = responses[key];
  if (typeof v === "string" && v.length > 0) return v;
  return null;
}

function readFirmographics(responses: AssessmentResponse): FirmographicInputs {
  const industry = getString(responses, "industry") as Industry | null;
  const employeeCountRange = getString(
    responses,
    "employee_count_range",
  ) as EmployeeCountRange | null;
  const annualRevenueRange = getString(
    responses,
    "annual_revenue_range",
  ) as AnnualRevenueRange | null;
  const hoursPerWeekRepetitive = getString(
    responses,
    "hours_per_week_repetitive",
  ) as HoursPerWeekRepetitive | null;

  return {
    industry,
    employeeCountRange,
    annualRevenueRange,
    hoursPerWeekRepetitive,
  };
}

// -----------------------------------------------------------------------------
// Math helpers
// -----------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n);
}

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Payback in months: `investment / (annual_savings / 12)`.
 * Guards against division by zero (when automation potential is nil).
 */
function paybackMonths(investment: number, annualSavings: number): number {
  if (annualSavings <= 0) return Number.POSITIVE_INFINITY;
  return roundOne(investment / (annualSavings / 12));
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Calculate an ROI projection from the respondent's answers. Tier can be
 * passed in (usual case from the orchestrator) or computed internally if
 * omitted — convenient for tests and direct callers.
 */
export function calculateROI(
  responses: AssessmentResponse,
  tier?: ReadinessTier,
): ROIEstimate {
  const firm = readFirmographics(responses);

  const effectiveTier: ReadinessTier =
    tier ??
    determineReadinessTier(
      calculateOverallScore({
        ...calculateDimensionScores(responses),
      }),
    );

  const industry = firm.industry ?? DEFAULT_INDUSTRY;
  const industryDefaulted = firm.industry === null;
  const loadedHourlyCost = INDUSTRY_LOADED_HOURLY_COST[industry];

  const hoursRange = firm.hoursPerWeekRepetitive ?? DEFAULT_HOURS_PER_WEEK;
  const hoursDefaulted = firm.hoursPerWeekRepetitive === null;
  const hoursPerWeek = HOURS_PER_WEEK_MIDPOINTS[hoursRange];

  const avgEmployeeCount =
    firm.employeeCountRange !== null
      ? EMPLOYEE_COUNT_MIDPOINTS[firm.employeeCountRange]
      : null;

  const annualRevenueMidpoint =
    firm.annualRevenueRange !== null
      ? ANNUAL_REVENUE_MIDPOINTS[firm.annualRevenueRange]
      : null;

  // Core economics.
  const annualLaborCost = hoursPerWeek * 52 * loadedHourlyCost;
  const automationPotentialLow = annualLaborCost * 0.4;
  const automationPotentialHigh = annualLaborCost * 0.65;

  const investment = INVESTMENT_BY_TIER[effectiveTier];
  const recommendedInvestmentLow = investment.low;
  const recommendedInvestmentHigh = investment.high;

  // Payback: best case uses low investment ÷ high savings; worst case the inverse.
  const paybackMonthsLow = paybackMonths(
    recommendedInvestmentLow,
    automationPotentialHigh,
  );
  const paybackMonthsHigh = paybackMonths(
    recommendedInvestmentHigh,
    automationPotentialLow,
  );

  const firstYearNetSavingsLow =
    automationPotentialLow - recommendedInvestmentHigh;
  const firstYearNetSavingsHigh =
    automationPotentialHigh - recommendedInvestmentLow;

  return {
    inputsUsed: {
      industry,
      industryDefaulted,
      loadedHourlyCost,
      employeeCountRange: firm.employeeCountRange,
      avgEmployeeCount,
      annualRevenueRange: firm.annualRevenueRange,
      annualRevenueMidpoint,
      hoursPerWeekRange: hoursRange,
      hoursPerWeekDefaulted: hoursDefaulted,
      hoursPerWeekMidpoint: hoursPerWeek,
      tier: effectiveTier,
    },
    annualLaborCost: round(annualLaborCost),
    automationPotentialLow: round(automationPotentialLow),
    automationPotentialHigh: round(automationPotentialHigh),
    recommendedInvestmentLow,
    recommendedInvestmentHigh,
    paybackMonthsLow,
    paybackMonthsHigh,
    firstYearNetSavingsLow: round(firstYearNetSavingsLow),
    firstYearNetSavingsHigh: round(firstYearNetSavingsHigh),
  };
}

// Re-exports so call-sites can grab the benchmark tables for UI chrome.
export {
  EMPLOYEE_COUNT_MIDPOINTS,
  HOURS_PER_WEEK_MIDPOINTS,
  ANNUAL_REVENUE_MIDPOINTS,
  INDUSTRY_LOADED_HOURLY_COST,
  INVESTMENT_BY_TIER,
};
