import { describe, expect, it } from "vitest";

import {
  isNotM365TenantFromSignals,
  responseIndicatesM365PrimaryProductivity,
  shouldShowAiReadinessCrossSell,
  shouldShowCopilotCrossSell,
} from "../promo";
import type { ScoreBreakdown } from "@/types/assessment";

const baseScores = {
  dataSecurityCompliance: 50,
  operationalProcessMaturity: 50,
  teamChangeManagement: 50,
  financialStrategicAlignment: 50,
  overall: 50,
} as const;

function scores(ti: number): ScoreBreakdown {
  return { ...baseScores, technologyInfrastructure: ti, overall: 50 };
}

describe("shouldShowCopilotCrossSell", () => {
  it("shows when AI product, M365 on productivity, and tech infra is low", () => {
    const ok = shouldShowCopilotCrossSell({
      productType: "ai_readiness",
      scores: scores(40),
      responses: {
        tech_productivity_suite: "Microsoft 365 (Outlook, Teams, SharePoint)",
      },
    });
    expect(ok).toBe(true);
  });

  it("does not show for copilot product", () => {
    const ok = shouldShowCopilotCrossSell({
      productType: "copilot_readiness",
      scores: scores(30),
      responses: {
        tech_productivity_suite: "Microsoft 365 (Outlook, Teams, SharePoint)",
      },
    });
    expect(ok).toBe(false);
  });
});

describe("responseIndicatesM365PrimaryProductivity", () => {
  it("matches stored label prefix", () => {
    expect(
      responseIndicatesM365PrimaryProductivity({
        tech_productivity_suite: "Microsoft 365 (Outlook, Teams, SharePoint)",
      }),
    ).toBe(true);
    expect(
      responseIndicatesM365PrimaryProductivity({
        tech_productivity_suite: "Google Workspace (Gmail, Drive, Meet)",
      }),
    ).toBe(false);
  });
});

describe("isNotM365TenantFromSignals", () => {
  it("returns true when not_m365_tenant is present", () => {
    expect(isNotM365TenantFromSignals(["not_m365_tenant"])).toBe(true);
  });

  it("returns false for empty or missing signals", () => {
    expect(isNotM365TenantFromSignals(undefined)).toBe(false);
    expect(isNotM365TenantFromSignals([])).toBe(false);
    expect(isNotM365TenantFromSignals(["m365_tenant"])).toBe(false);
  });
});

describe("shouldShowAiReadinessCrossSell", () => {
  it("shows when Copilot product and derived status is not_microsoft_365_tenant", () => {
    expect(
      shouldShowAiReadinessCrossSell({
        productType: "copilot_readiness",
        copilotRelevanceStatus: "not_microsoft_365_tenant",
      }),
    ).toBe(true);
  });

  it("shows when Copilot product and raw supplemental signal is not_m365_tenant", () => {
    expect(
      shouldShowAiReadinessCrossSell({
        productType: "copilot_readiness",
        m365Signals: ["not_m365_tenant"],
      }),
    ).toBe(true);
  });

  it("does not show for AI product regardless of signals", () => {
    expect(
      shouldShowAiReadinessCrossSell({
        productType: "ai_readiness",
        copilotRelevanceStatus: "not_microsoft_365_tenant",
        m365Signals: ["not_m365_tenant"],
      }),
    ).toBe(false);
  });

  it("does not show when respondent is an M365 tenant", () => {
    expect(
      shouldShowAiReadinessCrossSell({
        productType: "copilot_readiness",
        copilotRelevanceStatus: "microsoft_365_tenant",
      }),
    ).toBe(false);
  });
});
