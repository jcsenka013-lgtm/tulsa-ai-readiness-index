/**
 * Per-process ROI model behind the results-page ROI explorer. Implements the
 * formulas documented in `roi-calculator.json` (`calculations`) against the
 * industry process lists in the same file, so the JSON stays the single
 * source of truth for assumptions.
 */

import model from "@/lib/questions/roi-calculator.json";

export interface RoiProcess {
  id: string;
  label: string;
  description: string;
  defaultHoursPerWeek: number;
  defaultStaff: number;
  automation: { min: number; likely: number; max: number };
  implementationCost: { min: number; max: number };
}

export interface RoiIndustryModel {
  id: string;
  label: string;
  defaultLaborCostPerHour: number;
  processes: RoiProcess[];
}

export interface ProcessInput {
  id: string;
  hoursPerWeek: number;
  staff: number;
}

export interface RoiExplorerInputs {
  industry: string;
  adminHeadcount: number;
  laborCostPerHour: number;
  processes: ProcessInput[];
}

export interface RoiExplorerResult {
  currentAnnualCost: number;
  savings: { conservative: number; likely: number; optimistic: number };
  implementationCost: { min: number; max: number; point: number };
  annualSubscriptionCost: number;
  /** Null when likely savings don't cover the subscription (never pays back). */
  paybackMonthsLikely: number | null;
  threeYearNetLikely: number;
  threeYearRoiPercentLikely: number;
}

const G = model.global_assumptions;
const COSTS = model.ongoing_cost_assumptions;
const LABOR_DEFAULTS = model.inputs.loaded_labor_cost_per_hour.industry_defaults as Record<
  string,
  number
>;

export const ADMIN_HEADCOUNT_LIMITS = {
  min: model.inputs.admin_headcount.min,
  max: model.inputs.admin_headcount.max,
  default: model.inputs.admin_headcount.default,
};
export const LABOR_COST_LIMITS = {
  min: model.inputs.loaded_labor_cost_per_hour.min,
  max: model.inputs.loaded_labor_cost_per_hour.max,
};

/** The JSON names this per industry (`..._per_practice`, `..._per_firm`, ...). */
function defaultHours(process: object): number {
  for (const [key, value] of Object.entries(process)) {
    if (key.startsWith("default_hours_per_week") && typeof value === "number") return value;
  }
  return 0;
}

/** The modeled industry for an assessment's industry answer, or null. */
export function getRoiIndustry(industry: string | null | undefined): RoiIndustryModel | null {
  const found = model.industries.find((i) => i.id === industry);
  if (!found) return null;
  return {
    id: found.id,
    label: found.label,
    defaultLaborCostPerHour: LABOR_DEFAULTS[found.id] ?? 40,
    processes: found.processes.map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      defaultHoursPerWeek: defaultHours(p),
      defaultStaff: p.default_staff_involved,
      automation: p.realistic_automation_percentage,
      implementationCost: p.implementation_cost,
    })),
  };
}

const clamp = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;

export function calculateRoiExplorer(inputs: RoiExplorerInputs): RoiExplorerResult | null {
  const industry = getRoiIndustry(inputs.industry);
  if (!industry) return null;

  const labor = clamp(inputs.laborCostPerHour, LABOR_COST_LIMITS.min, LABOR_COST_LIMITS.max);
  const headcount = clamp(
    inputs.adminHeadcount,
    ADMIN_HEADCOUNT_LIMITS.min,
    ADMIN_HEADCOUNT_LIMITS.max,
  );

  let current = 0;
  const savings = { conservative: 0, likely: 0, optimistic: 0 };
  const impl = { min: 0, max: 0 };

  for (const input of inputs.processes) {
    const proc = industry.processes.find((p) => p.id === input.id);
    if (!proc) continue;
    const cost =
      clamp(input.hoursPerWeek, 0, 80) *
      clamp(input.staff, 0, 50) *
      labor *
      G.working_weeks_per_year;
    current += cost;
    savings.conservative += cost * proc.automation.min * G.productivity_reinvestment_factor;
    savings.likely += cost * proc.automation.likely * G.productivity_reinvestment_factor;
    savings.optimistic += cost * proc.automation.max * G.productivity_reinvestment_factor;
    impl.min += proc.implementationCost.min;
    impl.max += proc.implementationCost.max;
  }

  const point = (impl.min + impl.max) / 2;
  const subscription =
    inputs.processes.length > 0
      ? headcount * COSTS.per_user_ai_license_cost_annual + COSTS.platform_fixed_annual
      : 0;
  const monthlyNet = (savings.likely - subscription) / 12;
  const threeYearCost = point + subscription * 3;
  const threeYearNet = savings.likely * 3 - threeYearCost;

  return {
    currentAnnualCost: Math.round(current),
    savings: {
      conservative: Math.round(savings.conservative),
      likely: Math.round(savings.likely),
      optimistic: Math.round(savings.optimistic),
    },
    implementationCost: { min: impl.min, max: impl.max, point: Math.round(point) },
    annualSubscriptionCost: subscription,
    paybackMonthsLikely: monthlyNet > 0 ? Math.round((point / monthlyNet) * 10) / 10 : null,
    threeYearNetLikely: Math.round(threeYearNet),
    threeYearRoiPercentLikely:
      threeYearCost > 0 ? Math.round((threeYearNet / threeYearCost) * 100) : 0,
  };
}
