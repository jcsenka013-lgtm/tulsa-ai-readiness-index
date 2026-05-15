/**
 * Tulsa AI Readiness Index — question-bank types.
 *
 * These types mirror the v1.0.0 schema in `questions.json`. The scoring
 * engine reads the bank through these types so new questions (or tuning
 * existing weights / option scores) never requires code changes.
 *
 * Scoring formula (applied per domain):
 *
 *     domain_score = Σ(question_score × question_weight)
 *                  / Σ(max_option_score × question_weight for answered qs)
 *                  × 100
 *
 * Notes:
 *   - `question_score` for a `single_select` is the selected option's
 *     `score_value`.
 *   - `question_score` for a `multi_select` is the MAX `score_value` of the
 *     selected options. We use max (not sum) so that the strongest
 *     capability signaled wins — e.g. "Defender XDR fully integrated" (4)
 *     dominates partial components (2, 3). Picking zero options counts as 0.
 *   - Unanswered questions are excluded from BOTH the numerator and the
 *     denominator (treated as N/A, not "answered zero"). This prevents
 *     penalising respondents for the tiered bank (the free tier only asks a
 *     subset of questions; the paid tier asks everything).
 */

export type DomainId =
  | "data_security_compliance"
  | "operational_process_maturity"
  | "technology_infrastructure"
  | "team_change_management"
  | "financial_strategic_alignment";

export type QuestionType = "single_select" | "multi_select";

export type QuestionTier = "free" | "paid";

export interface QuestionOption {
  label: string;
  score_value: number;
  /** Drives M365 / Copilot gap analysis when the option is selected. */
  m365_signal?: string;
}

export interface BankQuestion {
  id: string;
  domain: DomainId;
  text: string;
  help_text: string;
  question_type: QuestionType;
  weight: number;
  tier: QuestionTier;
  options: QuestionOption[];
  /**
   * Contingency (not part of the v1 JSON yet — reserved for future use).
   * When set, this question is only scored if the referenced question's
   * answer overlaps `selectedAny`. Exposed here so the scoring engine is
   * ready when the bank adds governance follow-ups.
   */
  onlyIf?: {
    questionId: string;
    selectedAny: string[];
  };
}

export interface BankDomain {
  id: DomainId;
  name: string;
  description: string;
  /** Percentage weight toward the overall score. The five weights sum to 100. */
  weight: number;
  questions: BankQuestion[];
}

/**
 * One domain’s questions as shown in a multi-step assessment (intro + firmographics
 * + one step per domain + contact). Used for both free-only and Copilot-extended sets.
 */
export interface DomainQuestionSlice {
  id: DomainId;
  name: string;
  description: string;
  questions: readonly BankQuestion[];
}

export interface ReadinessTierBand {
  /** Inclusive lower bound. */
  min: number;
  /** Inclusive upper bound. */
  max: number;
}

export interface QuestionBankDocument {
  version: string;
  scoring_scale: Record<string, string>;
  scoring_formula: string;
  tiers: Record<QuestionTier, string>;
  readiness_tier_thresholds: Record<
    "foundation" | "exploration" | "pilot" | "scale",
    [number, number]
  >;
  domains: BankDomain[];
}
