import { describe, expect, it } from "vitest";

import { calculateRoiExplorer, getRoiIndustry } from "../roiExplorer";

describe("getRoiIndustry", () => {
  it("returns the modeled industries and null for others", () => {
    for (const id of ["dental", "insurance", "legal", "oil_gas"]) {
      const model = getRoiIndustry(id)!;
      expect(model.processes.length).toBeGreaterThan(0);
      for (const p of model.processes) {
        expect(p.defaultHoursPerWeek, `${p.id} hours`).toBeGreaterThan(0);
        expect(p.defaultStaff, `${p.id} staff`).toBeGreaterThan(0);
      }
    }
    expect(getRoiIndustry("healthcare_other")).toBeNull();
    expect(getRoiIndustry(null)).toBeNull();
  });
});

describe("calculateRoiExplorer", () => {
  it("follows the roi-calculator.json formulas for one process", () => {
    // dental_insurance_verification: automation 0.55 / 0.75 / 0.9, impl 8k–22k
    const r = calculateRoiExplorer({
      industry: "dental",
      adminHeadcount: 5,
      laborCostPerHour: 32,
      processes: [{ id: "dental_insurance_verification", hoursPerWeek: 15, staff: 2 }],
    })!;
    const cost = 15 * 2 * 32 * 50; // 48,000
    expect(r.currentAnnualCost).toBe(cost);
    expect(r.savings.conservative).toBe(Math.round(cost * 0.55 * 0.85));
    expect(r.savings.likely).toBe(Math.round(cost * 0.75 * 0.85));
    expect(r.savings.optimistic).toBe(Math.round(cost * 0.9 * 0.85));
    expect(r.implementationCost).toEqual({ min: 8000, max: 22000, point: 15000 });
    expect(r.annualSubscriptionCost).toBe(5 * 360 + 6000);
    const monthlyNet = (cost * 0.75 * 0.85 - 7800) / 12;
    expect(r.paybackMonthsLikely).toBeCloseTo(15000 / monthlyNet, 1);
  });

  it("reports no payback when savings don't cover the subscription", () => {
    const r = calculateRoiExplorer({
      industry: "dental",
      adminHeadcount: 50,
      laborCostPerHour: 15,
      processes: [{ id: "dental_patient_intake", hoursPerWeek: 1, staff: 1 }],
    })!;
    expect(r.paybackMonthsLikely).toBeNull();
    expect(r.threeYearNetLikely).toBeLessThan(0);
  });

  it("ignores unknown processes and clamps out-of-range inputs", () => {
    const r = calculateRoiExplorer({
      industry: "legal",
      adminHeadcount: 9999,
      laborCostPerHour: -5,
      processes: [{ id: "not_a_process", hoursPerWeek: 10, staff: 1 }],
    })!;
    expect(r.currentAnnualCost).toBe(0);
    expect(r.implementationCost.point).toBe(0);
  });

  it("is zero-cost with nothing selected", () => {
    const r = calculateRoiExplorer({
      industry: "insurance",
      adminHeadcount: 5,
      laborCostPerHour: 38,
      processes: [],
    })!;
    expect(r.annualSubscriptionCost).toBe(0);
    expect(r.paybackMonthsLikely).toBeNull();
  });
});
