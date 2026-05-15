/**
 * Typed loader for the canonical question bank (`questions.json`).
 *
 * Keep all knowledge of JSON structure behind this module — the rest of the
 * app imports from `@/lib/questions` and gets already-typed values.
 */

import rawBank from "./questions.json";
import rawCopilotSupplemental from "./copilot-supplemental.json";
import type {
  BankDomain,
  BankQuestion,
  DomainId,
  QuestionBankDocument,
  QuestionOption,
  QuestionTier,
  QuestionType,
  ReadinessTierBand,
} from "./types";
import type { ReadinessTier } from "@/types/assessment";

// -----------------------------------------------------------------------------
// Copilot supplemental bank (separate from version-controlled questions.json)
// -----------------------------------------------------------------------------

type RawCopilotOption = {
  label: string;
  score_value: number;
  m365_signal?: string;
};

type RawCopilotQuestion = {
  id: string;
  domain: DomainId;
  tier: string;
  type: QuestionType;
  weight: number;
  text: string;
  help_text: string;
  options: RawCopilotOption[];
};

function normalizeSupplementalQuestion(q: RawCopilotQuestion): BankQuestion {
  return {
    id: q.id,
    domain: q.domain,
    text: q.text,
    help_text: q.help_text,
    question_type: q.type,
    weight: q.weight,
    tier: q.tier as QuestionTier,
    options: q.options.map(
      (o): QuestionOption => ({
        label: o.label,
        score_value: o.score_value,
        ...(o.m365_signal != null && o.m365_signal !== ""
          ? { m365_signal: o.m365_signal }
          : {}),
      }),
    ),
  };
}

const COPILOT_SUPPLEMENTAL_FLAT: readonly BankQuestion[] = (
  rawCopilotSupplemental as { questions: RawCopilotQuestion[] }
).questions.map(normalizeSupplementalQuestion);

const SUPPLEMENTAL_BY_ID: ReadonlyMap<string, BankQuestion> = new Map(
  COPILOT_SUPPLEMENTAL_FLAT.map((q) => [q.id, q]),
);

const SUPPLEMENTAL_BY_DOMAIN: ReadonlyMap<DomainId, readonly BankQuestion[]> =
  (() => {
    const m = new Map<DomainId, BankQuestion[]>();
    for (const q of COPILOT_SUPPLEMENTAL_FLAT) {
      const list = m.get(q.domain) ?? [];
      list.push(q);
      m.set(q.domain, list);
    }
    return m;
  })();

/** Additional Copilot/M365 questions kept out of the main `questions.json` bank. */
export function loadCopilotSupplementalQuestions(): BankQuestion[] {
  return [...COPILOT_SUPPLEMENTAL_FLAT];
}

export function getCopilotSupplementalForDomain(
  id: DomainId,
): readonly BankQuestion[] {
  return SUPPLEMENTAL_BY_DOMAIN.get(id) ?? [];
}

export const QUESTION_BANK = rawBank as unknown as QuestionBankDocument;

/** All five domains, in presentation order. */
export const DOMAINS: readonly BankDomain[] = QUESTION_BANK.domains;

/** Flattened list of every question in the bank. */
export const ALL_QUESTIONS: readonly BankQuestion[] = DOMAINS.flatMap(
  (d) => d.questions,
);

/** Lookup a question by id. Returns `undefined` if the id is unknown. */
const QUESTIONS_BY_ID: ReadonlyMap<string, BankQuestion> = new Map(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);

export function getQuestion(id: string): BankQuestion | undefined {
  return QUESTIONS_BY_ID.get(id) ?? SUPPLEMENTAL_BY_ID.get(id);
}

/** Lookup a domain by id. Throws if the id is unknown (bank config error). */
export function getDomain(id: DomainId): BankDomain {
  const domain = DOMAINS.find((d) => d.id === id);
  if (!domain) {
    throw new Error(`Unknown domain id: ${id}`);
  }
  return domain;
}

/**
 * The tier bands as inclusive ranges. The JSON stores them as `[min, max]`
 * tuples; expose a typed object for callers.
 */
export const TIER_BANDS: Record<ReadinessTier, ReadinessTierBand> = {
  foundation: {
    min: QUESTION_BANK.readiness_tier_thresholds.foundation[0],
    max: QUESTION_BANK.readiness_tier_thresholds.foundation[1],
  },
  exploration: {
    min: QUESTION_BANK.readiness_tier_thresholds.exploration[0],
    max: QUESTION_BANK.readiness_tier_thresholds.exploration[1],
  },
  pilot: {
    min: QUESTION_BANK.readiness_tier_thresholds.pilot[0],
    max: QUESTION_BANK.readiness_tier_thresholds.pilot[1],
  },
  scale: {
    min: QUESTION_BANK.readiness_tier_thresholds.scale[0],
    max: QUESTION_BANK.readiness_tier_thresholds.scale[1],
  },
};

/**
 * Look up the label for a selected option value on a given question.
 * Helpful for insight copy that references the user's own words.
 *
 * The bank stores options keyed by label (no stable `value`), so we treat
 * the label itself as the stored answer value. Multi-selects store an array
 * of labels.
 */
export function labelForOption(
  questionId: string,
  value: string,
): string | undefined {
  const q = QUESTIONS_BY_ID.get(questionId);
  if (!q) return undefined;
  return q.options.find((o) => o.label === value)?.label;
}
