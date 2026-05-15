import { DOMAINS, loadCopilotSupplementalQuestions } from "@/lib/questions/bank";
import type { BankQuestion, DomainQuestionSlice } from "@/lib/questions/types";
import type { ProductType } from "@/types/assessment";

/**
 * All free-tier questions in bank order (two per domain — current AI product).
 */
export function getAIReadinessAssessmentQuestions(): BankQuestion[] {
  return DOMAINS.flatMap((d) => d.questions.filter((q) => q.tier === "free"));
}

/**
 * Free-tier main-bank questions plus the Copilot supplemental set
 * (`copilot-supplemental.json`) — in domain order, then all supplemental
 * questions in file order.
 */
export function getCopilotAssessmentQuestions(): BankQuestion[] {
  return [
    ...getAIReadinessAssessmentQuestions(),
    ...loadCopilotSupplementalQuestions(),
  ];
}

/**
 * Domain slices for the AI Readiness flow (unchanged behavior).
 */
export function getAIReadinessSlicesByDomain(): readonly DomainQuestionSlice[] {
  return DOMAINS.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    questions: d.questions.filter((q) => q.tier === "free"),
  }));
}

/**
 * Domain slices for the Copilot flow: free main-bank questions, then
 * supplemental questions for that domain, in file order.
 */
export function getCopilotSlicesByDomain(): readonly DomainQuestionSlice[] {
  const supplemental = loadCopilotSupplementalQuestions();
  const byDomain = new Map<string, BankQuestion[]>();
  for (const q of supplemental) {
    const list = byDomain.get(q.domain) ?? [];
    list.push(q);
    byDomain.set(q.domain, list);
  }
  return DOMAINS.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    questions: [
      ...d.questions.filter((q) => q.tier === "free"),
      ...(byDomain.get(d.id) ?? []),
    ],
  }));
}

export function getDomainSlicesForProduct(
  productType: ProductType,
): readonly DomainQuestionSlice[] {
  return productType === "copilot_readiness"
    ? getCopilotSlicesByDomain()
    : getAIReadinessSlicesByDomain();
}
