import { describe, expect, it } from "vitest";

import { toPublicAssessment } from "@/lib/assessment/public-row";
import { SAMPLE_DENTAL_RESPONSES } from "@/lib/sample-report/dental-practice-fixture";

import { buildBriefInput, CALL_BRIEF_SCHEMA, isCallBrief, type CallBrief } from "../call-brief";
import { buildAssistantContext } from "../tools";

const ROW = {
  id: "a1",
  status: "completed",
  product_type: "ai_readiness",
  company_name: "Sample Dental Practice",
  industry: "dental",
  employee_count_range: "6-20",
  annual_revenue_range: null,
  email: "owner@example.com",
  phone: "918-555-0100",
  full_name: "Pat Example",
  responses: SAMPLE_DENTAL_RESPONSES,
};

const BRIEF: CallBrief = {
  headline: "Solid basics, but patient data and AI use need guardrails first.",
  situation: "A six-to-twenty person dental office with partial MFA.",
  top_pains: [{ title: "MFA gaps", evidence: "Answered 'Some accounts'" }],
  talking_points: ["You already back up nightly."],
  questions_to_ask: ["Who signs off on IT spend?"],
  likely_objections: [{ objection: "We're too small", response: "Most of this is settings." }],
  recommended_offer: { engagement: "foundation_work", why: "Regulated data plus MFA gaps." },
  watch_outs: [],
};

describe("call brief", () => {
  it("input covers every domain and leaves out contact details", async () => {
    const input = await buildBriefInput(buildAssistantContext(ROW), "Office manager");
    expect(input.contact_role).toBe("Office manager");
    expect(input.answers_by_domain).toHaveLength(5);
    const text = JSON.stringify(input);
    expect(text).not.toContain("owner@example.com");
    expect(text).not.toContain("918-555-0100");
    expect(text).not.toContain("Pat Example");
  });

  it("validates the brief shape", () => {
    expect(isCallBrief(BRIEF)).toBe(true);
    expect(isCallBrief({ ...BRIEF, recommended_offer: { engagement: "upsell", why: "x" } })).toBe(
      false,
    );
    expect(isCallBrief({ ...BRIEF, talking_points: "one string" })).toBe(false);
    expect(isCallBrief(null)).toBe(false);
  });

  it("schema requires every field the validator checks", () => {
    expect(CALL_BRIEF_SCHEMA.required.sort()).toEqual(Object.keys(BRIEF).sort());
  });
});

describe("toPublicAssessment", () => {
  it("never returns the admin brief", () => {
    for (const status of ["in_progress", "completed"]) {
      const out = toPublicAssessment({ ...ROW, status, call_brief: BRIEF, call_brief_generated_at: "x" });
      expect(out).not.toHaveProperty("call_brief");
      expect(out).not.toHaveProperty("call_brief_generated_at");
    }
  });

  it("drops contact details once complete, keeps them while in progress", () => {
    expect(toPublicAssessment(ROW)).not.toHaveProperty("email");
    expect(toPublicAssessment(ROW)).not.toHaveProperty("phone");
    expect(toPublicAssessment({ ...ROW, status: "in_progress" })).toHaveProperty("email");
  });
});
