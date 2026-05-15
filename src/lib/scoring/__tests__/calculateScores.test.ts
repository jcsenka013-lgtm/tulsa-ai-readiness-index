import { describe, expect, it } from "vitest";

import {
  calculateDimensionScores,
  calculateOverallScore,
  determineReadinessTier,
  determineRecommendedNextStep,
} from "@/lib/scoring/calculateScores";
import { TIER_BANDS } from "@/lib/questions/bank";
import type { ScoreBreakdown } from "@/types/assessment";

import {
  HIGH_RESPONSES,
  LOW_RESPONSES,
  MEDIUM_RESPONSES,
} from "./fixtures";

function breakdownFor(
  domainScores: ReturnType<typeof calculateDimensionScores>,
): ScoreBreakdown {
  return { ...domainScores, overall: calculateOverallScore(domainScores) };
}

describe("calculateDimensionScores", () => {
  it("produces 0-100 integers for every domain", () => {
    const low = calculateDimensionScores(LOW_RESPONSES);
    for (const v of Object.values(low)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("returns 0 across the board for an empty response set", () => {
    const empty = calculateDimensionScores({});
    expect(empty.dataSecurityCompliance).toBe(0);
    expect(empty.operationalProcessMaturity).toBe(0);
    expect(empty.technologyInfrastructure).toBe(0);
    expect(empty.teamChangeManagement).toBe(0);
    expect(empty.financialStrategicAlignment).toBe(0);
  });

  it("scores the LOW fixture in the bottom of every domain (<40)", () => {
    const s = calculateDimensionScores(LOW_RESPONSES);
    expect(s.dataSecurityCompliance).toBeLessThan(40);
    expect(s.operationalProcessMaturity).toBeLessThan(40);
    expect(s.technologyInfrastructure).toBeLessThan(40);
    expect(s.teamChangeManagement).toBeLessThan(40);
    expect(s.financialStrategicAlignment).toBeLessThan(40);
  });

  it("scores the MEDIUM fixture in the middle (40-79) for each domain", () => {
    const s = calculateDimensionScores(MEDIUM_RESPONSES);
    for (const [, v] of Object.entries(s)) {
      expect(v).toBeGreaterThanOrEqual(30);
      expect(v).toBeLessThan(85);
    }
  });

  it("scores the HIGH fixture at the top of every domain (>=80)", () => {
    const s = calculateDimensionScores(HIGH_RESPONSES);
    expect(s.dataSecurityCompliance).toBeGreaterThanOrEqual(80);
    expect(s.operationalProcessMaturity).toBeGreaterThanOrEqual(80);
    expect(s.technologyInfrastructure).toBeGreaterThanOrEqual(80);
    expect(s.teamChangeManagement).toBeGreaterThanOrEqual(80);
    expect(s.financialStrategicAlignment).toBeGreaterThanOrEqual(80);
  });

  it("scales multi-select by the MAX selected option score", () => {
    // ds_defender_cloud_apps max option is "Microsoft 365 Defender XDR — fully integrated" (4).
    // Picking that alone should score identically to also picking lower-scored Defenders.
    const justXdr = calculateDimensionScores({
      ...MEDIUM_RESPONSES,
      ds_defender_cloud_apps: ["Microsoft 365 Defender XDR — fully integrated"],
    });
    const xdrPlusOthers = calculateDimensionScores({
      ...MEDIUM_RESPONSES,
      ds_defender_cloud_apps: [
        "Defender for Office 365 (email)",
        "Defender for Endpoint (devices)",
        "Microsoft 365 Defender XDR — fully integrated",
      ],
    });
    expect(justXdr.dataSecurityCompliance).toBe(xdrPlusOthers.dataSecurityCompliance);
  });

  it("excludes unanswered questions from both numerator and denominator", () => {
    // Answering a single strong question should yield 100 for that domain.
    // ds_mfa_coverage max is "All users on MFA plus phishing-resistant...".
    const oneStrong = calculateDimensionScores({
      ds_mfa_coverage:
        "All users on MFA plus phishing-resistant methods (FIDO2 / Authenticator number matching)",
    });
    expect(oneStrong.dataSecurityCompliance).toBe(100);
  });

  it("runs in well under 10ms", () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      calculateDimensionScores(MEDIUM_RESPONSES);
    }
    const avgMs = (performance.now() - start) / 100;
    expect(avgMs).toBeLessThan(10);
  });
});

describe("calculateOverallScore", () => {
  it("weights domains correctly (equal domain scores yield the same overall)", () => {
    const equal = calculateOverallScore({
      dataSecurityCompliance: 60,
      operationalProcessMaturity: 60,
      technologyInfrastructure: 60,
      teamChangeManagement: 60,
      financialStrategicAlignment: 60,
    });
    expect(equal).toBe(60);
  });

  it("gives data_security_compliance a 25% weight", () => {
    // 100 in data_security, 0 elsewhere → 25 overall.
    const s = calculateOverallScore({
      dataSecurityCompliance: 100,
      operationalProcessMaturity: 0,
      technologyInfrastructure: 0,
      teamChangeManagement: 0,
      financialStrategicAlignment: 0,
    });
    expect(s).toBe(25);
  });

  it("gives technology_infrastructure a 20% weight", () => {
    const s = calculateOverallScore({
      dataSecurityCompliance: 0,
      operationalProcessMaturity: 0,
      technologyInfrastructure: 100,
      teamChangeManagement: 0,
      financialStrategicAlignment: 0,
    });
    expect(s).toBe(20);
  });

  it("gives team_change and financial_strategic 15% weights", () => {
    const teamOnly = calculateOverallScore({
      dataSecurityCompliance: 0,
      operationalProcessMaturity: 0,
      technologyInfrastructure: 0,
      teamChangeManagement: 100,
      financialStrategicAlignment: 0,
    });
    expect(teamOnly).toBe(15);

    const finOnly = calculateOverallScore({
      dataSecurityCompliance: 0,
      operationalProcessMaturity: 0,
      technologyInfrastructure: 0,
      teamChangeManagement: 0,
      financialStrategicAlignment: 100,
    });
    expect(finOnly).toBe(15);
  });
});

describe("determineReadinessTier — band boundaries", () => {
  it("uses the bank-defined bands (0-39 / 40-59 / 60-79 / 80-100)", () => {
    expect(TIER_BANDS.foundation).toEqual({ min: 0, max: 39 });
    expect(TIER_BANDS.exploration).toEqual({ min: 40, max: 59 });
    expect(TIER_BANDS.pilot).toEqual({ min: 60, max: 79 });
    expect(TIER_BANDS.scale).toEqual({ min: 80, max: 100 });
  });

  it.each([
    [0, "foundation"],
    [39, "foundation"],
    [40, "exploration"],
    [59, "exploration"],
    [60, "pilot"],
    [79, "pilot"],
    [80, "scale"],
    [100, "scale"],
  ] as const)("score %i → %s tier", (score, expected) => {
    expect(determineReadinessTier(score)).toBe(expected);
  });

  it("clamps out-of-range scores", () => {
    expect(determineReadinessTier(-10)).toBe("foundation");
    expect(determineReadinessTier(150)).toBe("scale");
  });

  it("rounds non-integer scores before banding", () => {
    expect(determineReadinessTier(39.4)).toBe("foundation");
    expect(determineReadinessTier(39.6)).toBe("exploration");
    expect(determineReadinessTier(79.4)).toBe("pilot");
    expect(determineReadinessTier(79.6)).toBe("scale");
  });
});

describe("determineRecommendedNextStep", () => {
  const emptyScores: ScoreBreakdown = {
    dataSecurityCompliance: 50,
    operationalProcessMaturity: 50,
    technologyInfrastructure: 50,
    teamChangeManagement: 50,
    financialStrategicAlignment: 50,
    overall: 50,
  };

  it("maps tier → next step for the happy path", () => {
    expect(determineRecommendedNextStep("foundation", {}, emptyScores)).toBe(
      "foundation_work",
    );
    expect(determineRecommendedNextStep("exploration", {}, emptyScores)).toBe(
      "audit",
    );
    expect(determineRecommendedNextStep("pilot", {}, emptyScores)).toBe("pilot");
    expect(determineRecommendedNextStep("scale", {}, emptyScores)).toBe(
      "retainer",
    );
  });

  it("overrides to foundation_work when regulated data + poor security posture", () => {
    const scores: ScoreBreakdown = { ...emptyScores, dataSecurityCompliance: 25 };
    const responses = {
      ds_compliance_requirements: ["HIPAA (patient health information)"],
    };
    // Even for a pilot-tier overall score, compliance gates the recommendation.
    expect(determineRecommendedNextStep("pilot", responses, scores)).toBe(
      "foundation_work",
    );
  });

  it("does NOT override when regulated data is present but security is fine", () => {
    const scores: ScoreBreakdown = { ...emptyScores, dataSecurityCompliance: 75 };
    const responses = {
      ds_compliance_requirements: ["HIPAA (patient health information)"],
    };
    expect(determineRecommendedNextStep("pilot", responses, scores)).toBe("pilot");
  });

  it("fixture tier mappings", () => {
    const lowScores = breakdownFor(calculateDimensionScores(LOW_RESPONSES));
    const highScores = breakdownFor(calculateDimensionScores(HIGH_RESPONSES));

    // LOW respondent handles HIPAA and scores low on security → foundation_work regardless of tier.
    const lowStep = determineRecommendedNextStep(
      determineReadinessTier(lowScores.overall),
      LOW_RESPONSES,
      lowScores,
    );
    expect(lowStep).toBe("foundation_work");

    // HIGH respondent should land at retainer.
    const highStep = determineRecommendedNextStep(
      determineReadinessTier(highScores.overall),
      HIGH_RESPONSES,
      highScores,
    );
    expect(highStep).toBe("retainer");
  });
});
