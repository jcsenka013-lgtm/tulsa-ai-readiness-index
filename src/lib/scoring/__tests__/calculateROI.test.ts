import { describe, expect, it } from "vitest";

import {
  calculateROI,
  HOURS_PER_WEEK_MIDPOINTS,
  INDUSTRY_LOADED_HOURLY_COST,
  INVESTMENT_BY_TIER,
} from "@/lib/scoring/calculateROI";

import { HIGH_RESPONSES, LOW_RESPONSES, MEDIUM_RESPONSES } from "./fixtures";

describe("calculateROI — math correctness", () => {
  it("uses the expected industry loaded hourly cost", () => {
    // Legal: 60/hr, 50-100 hrs/wk → midpoint 75 hrs/wk.
    const roi = calculateROI(HIGH_RESPONSES, "scale");
    expect(roi.inputsUsed.industry).toBe("legal");
    expect(roi.inputsUsed.loadedHourlyCost).toBe(
      INDUSTRY_LOADED_HOURLY_COST.legal,
    );
    expect(roi.inputsUsed.hoursPerWeekMidpoint).toBe(
      HOURS_PER_WEEK_MIDPOINTS["50_100"],
    );
  });

  it("annualLaborCost = hours × 52 × loaded_hourly", () => {
    const roi = calculateROI(MEDIUM_RESPONSES, "exploration");
    // Dental: 35/hr, 25-50 hrs/wk → 37 hrs/wk midpoint.
    const expected = 37 * 52 * 35;
    expect(roi.annualLaborCost).toBe(expected);
    expect(roi.automationPotentialLow).toBe(Math.round(expected * 0.4));
    expect(roi.automationPotentialHigh).toBe(Math.round(expected * 0.65));
  });

  it("recommendedInvestment ranges come from the tier table", () => {
    for (const tier of ["foundation", "exploration", "pilot", "scale"] as const) {
      const roi = calculateROI(MEDIUM_RESPONSES, tier);
      expect(roi.recommendedInvestmentLow).toBe(INVESTMENT_BY_TIER[tier].low);
      expect(roi.recommendedInvestmentHigh).toBe(INVESTMENT_BY_TIER[tier].high);
    }
  });

  it("payback months: low = invLow / (autoHigh / 12)", () => {
    const roi = calculateROI(MEDIUM_RESPONSES, "pilot");
    const expectedLow =
      Math.round(
        (roi.recommendedInvestmentLow / (roi.automationPotentialHigh / 12)) * 10,
      ) / 10;
    const expectedHigh =
      Math.round(
        (roi.recommendedInvestmentHigh / (roi.automationPotentialLow / 12)) * 10,
      ) / 10;
    expect(roi.paybackMonthsLow).toBeCloseTo(expectedLow, 1);
    expect(roi.paybackMonthsHigh).toBeCloseTo(expectedHigh, 1);
  });

  it("net savings: low = autoLow - invHigh, high = autoHigh - invLow", () => {
    const roi = calculateROI(MEDIUM_RESPONSES, "pilot");
    expect(roi.firstYearNetSavingsLow).toBe(
      roi.automationPotentialLow - roi.recommendedInvestmentHigh,
    );
    expect(roi.firstYearNetSavingsHigh).toBe(
      roi.automationPotentialHigh - roi.recommendedInvestmentLow,
    );
  });

  it("defaults industry and hours when missing, and flags the defaulting", () => {
    const roi = calculateROI({}, "exploration");
    expect(roi.inputsUsed.industryDefaulted).toBe(true);
    expect(roi.inputsUsed.hoursPerWeekDefaulted).toBe(true);
    expect(roi.inputsUsed.industry).toBe("other");
    expect(roi.annualLaborCost).toBeGreaterThan(0);
  });

  it("surfaces employee count + revenue midpoints when provided", () => {
    const roi = calculateROI(HIGH_RESPONSES, "scale");
    expect(roi.inputsUsed.avgEmployeeCount).toBe(75);
    expect(roi.inputsUsed.annualRevenueMidpoint).toBe(62_500_000);
  });

  it("worked example: legal, 75 hrs/wk, scale tier", () => {
    const roi = calculateROI(HIGH_RESPONSES, "scale");
    expect(roi.annualLaborCost).toBe(75 * 52 * 60); // 234,000
    expect(roi.automationPotentialLow).toBe(Math.round(234_000 * 0.4)); // 93,600
    expect(roi.automationPotentialHigh).toBe(Math.round(234_000 * 0.65)); // 152,100
    expect(roi.recommendedInvestmentLow).toBe(30_000);
    expect(roi.recommendedInvestmentHigh).toBe(90_000);
  });

  it("worked example: low scorer, dental, 37 hrs/wk, foundation tier", () => {
    const roi = calculateROI(LOW_RESPONSES, "foundation");
    expect(roi.annualLaborCost).toBe(37 * 52 * 35); // 67,340
    expect(roi.recommendedInvestmentLow).toBe(5_000);
    expect(roi.recommendedInvestmentHigh).toBe(12_000);
  });

  it("is synchronous and fast", () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      calculateROI(MEDIUM_RESPONSES, "pilot");
    }
    const avgMs = (performance.now() - start) / 1000;
    expect(avgMs).toBeLessThan(1);
  });
});
