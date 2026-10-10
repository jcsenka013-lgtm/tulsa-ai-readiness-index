/**
 * Guidance corpus for the results assistant's `search_guidance` tool.
 *
 * Built from the same content the scorer, results page, and PDF already use
 * (question help text, domain descriptions, tier and next-step copy), so the
 * assistant can only cite guidance this site already publishes.
 */

import {
  DOMAINS,
  getDomain,
  loadCopilotSupplementalQuestions,
} from "@/lib/questions/bank";
import {
  nextStepEngagementDetail,
  recommendedNextStepHeadline,
  recommendedNextStepShortCallout,
} from "@/lib/pdf/next-step-content";
import { TIER_DISPLAY, tierHeroParagraph } from "@/lib/pdf/tier-copy";
import type { ReadinessTier, RecommendedNextStep } from "@/types/assessment";

export interface KnowledgeChunk {
  id: string;
  title: string;
  text: string;
}

const TIERS: ReadinessTier[] = ["foundation", "exploration", "pilot", "scale"];
const NEXT_STEPS: RecommendedNextStep[] = [
  "foundation_work",
  "audit",
  "pilot",
  "retainer",
];

function buildCorpus(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  for (const domain of DOMAINS) {
    chunks.push({
      id: `domain:${domain.id}`,
      title: domain.name,
      text: `${domain.name} (${domain.weight}% of the overall score). ${domain.description}`,
    });
    for (const q of domain.questions) {
      chunks.push({
        id: `question:${q.id}`,
        title: q.text,
        text: `${domain.name}: ${q.text} ${q.help_text}`,
      });
    }
  }

  for (const q of loadCopilotSupplementalQuestions()) {
    chunks.push({
      id: `question:${q.id}`,
      title: q.text,
      text: `${getDomain(q.domain).name} (Copilot): ${q.text} ${q.help_text}`,
    });
  }

  for (const tier of TIERS) {
    chunks.push({
      id: `tier:${tier}`,
      title: `${TIER_DISPLAY[tier]} readiness tier`,
      text: tierHeroParagraph(tier),
    });
  }

  for (const step of NEXT_STEPS) {
    const detail = nextStepEngagementDetail(step);
    chunks.push({
      id: `next_step:${step}`,
      title: recommendedNextStepHeadline(step),
      text: [
        recommendedNextStepShortCallout(step),
        `Included: ${detail.included.join("; ")}.`,
        `Investment: ${detail.investmentRange}.`,
        `${detail.timeline}.`,
      ].join(" "),
    });
  }

  return chunks;
}

export const KNOWLEDGE_CORPUS: readonly KnowledgeChunk[] = buildCorpus();
