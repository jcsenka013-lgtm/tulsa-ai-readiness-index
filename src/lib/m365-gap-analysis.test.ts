import { describe, expect, it } from "vitest";

import type { AssessmentResponse } from "@/types/assessment";

import { analyzeM365SecurityGaps } from "./m365-gap-analysis";

describe("analyzeM365SecurityGaps", () => {
  it("dental practice on Business Basic — worst case, Copilot blocked, critical HIPAA gaps", () => {
    const responses: AssessmentResponse = {
      S1: "none",
      S2: ["phi_hipaa"],
      S2a: "none",
      S3: "never",
      m365_license_tier: "business_basic",
      m365_entra_plan: "free",
      m365_exchange_online: "no",
      m365_onedrive: "no",
      m365_loop: "no",
      m365_sensitivity_labels: "none",
      m365_restricted_sharepoint_search: "no",
      m365_copilot_add_on: "no",
      m365_dlp: "none",
      m365_audit_retention: "under_90",
      m365_baa_status: "not_executed",
      m365_external_sharing: "open",
    };

    const report = analyzeM365SecurityGaps({
      responses,
      industry: "dental",
      employeeCountRange: "6-20",
    });

    expect(report.current_license_tier).toBe("microsoft_365_business_basic");
    expect(report.copilot_readiness_status).toBe("blocked");

    const baa = report.compliance_gaps.find(
      (g) => g.control === "HIPAA Business Associate Agreement (BAA)",
    );
    expect(baa?.risk_level).toBe("critical");
    expect(baa?.remediation.admin_center_path).toContain(
      "Organization profile",
    );

    const prereqBase = report.copilot_prerequisites_status.find((p) =>
      p.requirement.includes("Qualifying Microsoft 365 base"),
    );
    expect(prereqBase?.status).toBe("not_met");

    expect(
      report.recommended_upgrades.some(
        (u) =>
          u.to_sku.includes("Business Standard") ||
          u.from_sku.includes("Business Basic"),
      ),
    ).toBe(true);

    expect(report.quick_wins.length).toBeGreaterThanOrEqual(3);
    expect(report.security_roadmap.days_0_30.some((s) => /BAA|HIPAA/i.test(s)))
      .toBe(true);
  });

  it("insurance agency on Business Premium — mid-maturity, upgrades possible", () => {
    const responses: AssessmentResponse = {
      S1: "documented_partial",
      S2: ["personal_pii"],
      S2a: "access_controls_training",
      S3: "annual",
      m365_license_tier: "business_premium",
      m365_entra_plan: "p1",
      m365_exchange_online: "yes",
      m365_onedrive: "yes",
      m365_loop: "yes",
      m365_sensitivity_labels: "pilot",
      m365_restricted_sharepoint_search: "no",
      m365_copilot_add_on: "no",
      m365_dlp: "basic",
      m365_audit_retention: "90_days",
      m365_external_sharing: "limited",
    };

    const report = analyzeM365SecurityGaps({
      responses,
      industry: "insurance",
      employeeCountRange: "21-50",
    });

    expect(report.current_license_tier).toBe("microsoft_365_business_premium");
    expect(["possible_with_upgrades", "ready_with_gaps"]).toContain(
      report.copilot_readiness_status,
    );

    expect(
      report.compliance_gaps.some((g) =>
        g.industry_requirement.toLowerCase().includes("naic"),
      ),
    ).toBe(true);

    expect(
      report.recommended_upgrades.some((u) =>
        u.capabilities_unlocked.some((c) =>
          c.toLowerCase().includes("copilot"),
        ),
      ),
    ).toBe(true);
  });

  it("law firm on E3 — mostly ready, privilege / sharing controls emphasized", () => {
    const responses: AssessmentResponse = {
      S1: "documented_enforced",
      S2: ["legal_privileged"],
      S2a: "formal_compliance_program",
      S3: "quarterly_or_more",
      m365_license_tier: "e3",
      m365_entra_plan: "p2",
      m365_exchange_online: "yes",
      m365_onedrive: "yes",
      m365_loop: "yes",
      m365_sensitivity_labels: "org_wide",
      m365_restricted_sharepoint_search: "yes",
      m365_copilot_add_on: "yes",
      m365_dlp: "standard",
      m365_audit_retention: "one_year_plus",
      m365_external_sharing: "limited",
      m365_purview_insider_risk: "yes",
    };

    const report = analyzeM365SecurityGaps({
      responses,
      industry: "legal",
      employeeCountRange: "51-100",
    });

    expect(report.current_license_tier).toBe("microsoft_365_e3");
    expect(["ready", "ready_with_gaps"]).toContain(
      report.copilot_readiness_status,
    );

    expect(
      report.copilot_prerequisites_status.filter((p) => p.status === "met")
        .length,
    ).toBeGreaterThanOrEqual(4);

    const privilegeGap = report.compliance_gaps.find((g) =>
      g.control.toLowerCase().includes("ethical wall"),
    );
    expect(privilegeGap).toBeUndefined();

    expect(
      report.compliance_gaps.every((g) => g.remediation.effort),
    ).toBe(true);
  });

  it("oil & gas operator on E5 with hybrid identity — segmentation & hybrid hardening", () => {
    const responses: AssessmentResponse = {
      S1: "documented_enforced",
      S2: ["personal_pii"],
      S2a: "formal_compliance_program",
      S3: "annual",
      m365_license_tier: "e5",
      m365_entra_plan: "p2",
      m365_exchange_online: "yes",
      m365_onedrive: "yes",
      m365_loop: "yes",
      m365_sensitivity_labels: "org_wide",
      m365_restricted_sharepoint_search: "yes",
      m365_copilot_add_on: "yes",
      m365_dlp: "advanced",
      m365_audit_retention: "one_year_plus",
      m365_hybrid_identity: "yes",
      m365_external_sharing: "limited",
      m365_purview_insider_risk: "yes",
    };

    const report = analyzeM365SecurityGaps({
      responses,
      industry: "oil_gas",
      employeeCountRange: "100+",
    });

    expect(report.current_license_tier).toBe("microsoft_365_e5");
    expect(
      report.compliance_gaps.some((g) =>
        g.control.toLowerCase().includes("itar"),
      ),
    ).toBe(true);

    expect(
      report.compliance_gaps.some((g) =>
        g.control.toLowerCase().includes("hybrid identity"),
      ),
    ).toBe(true);

    expect(
      report.recommended_upgrades.some((u) => u.to_sku.includes("E5")),
    ).toBe(false);

    expect(report.security_roadmap.days_61_90.some((s) => /insider risk/i.test(s)))
      .toBe(true);
  });
});
