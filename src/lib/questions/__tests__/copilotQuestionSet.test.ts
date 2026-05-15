import { describe, expect, it } from "vitest";

import {
  ALL_QUESTIONS,
  DOMAINS,
  loadCopilotSupplementalQuestions,
} from "@/lib/questions/bank";
import {
  getAIReadinessAssessmentQuestions,
  getCopilotAssessmentQuestions,
} from "@/lib/questions/copilotQuestionSet";
import type { DomainId } from "@/lib/questions/types";

const ALL_IDS = new Set(ALL_QUESTIONS.map((q) => q.id));
const SUPP_IDS = new Set(loadCopilotSupplementalQuestions().map((q) => q.id));

describe("getAIReadinessAssessmentQuestions", () => {
  it("is exactly all tier=free questions in bank order", () => {
    const free = getAIReadinessAssessmentQuestions();
    const expected = DOMAINS.flatMap((d) => d.questions.filter((q) => q.tier === "free"));
    expect(free).toEqual(expected);
  });
});

describe("getCopilotAssessmentQuestions", () => {
  it("is free main bank plus exactly five Copilot supplemental questions", () => {
    const q = getCopilotAssessmentQuestions();
    expect(getAIReadinessAssessmentQuestions().length + 5).toBe(q.length);
  });

  it("only references main-bank or supplemental question ids", () => {
    for (const x of getCopilotAssessmentQuestions()) {
      expect(ALL_IDS.has(x.id) || SUPP_IDS.has(x.id)).toBe(true);
    }
  });

  it("includes at least 2 questions per domain", () => {
    const byDomain = new Map<DomainId, number>();
    for (const d of DOMAINS) {
      byDomain.set(d.id, 0);
    }
    for (const qu of getCopilotAssessmentQuestions()) {
      byDomain.set(qu.domain, (byDomain.get(qu.domain) ?? 0) + 1);
    }
    for (const d of DOMAINS) {
      expect(byDomain.get(d.id)).toBeGreaterThanOrEqual(2);
    }
  });
});
