/**
 * Semantic search over the guidance corpus.
 *
 * Embeds with Workers AI (`@cf/baai/bge-base-en-v1.5`) when the `AI` binding
 * is available (deployed Worker, `vite dev`), and falls back to keyword
 * overlap under `next dev` and in tests where no binding exists.
 */

import { KNOWLEDGE_CORPUS, type KnowledgeChunk } from "./knowledge";
import { getWorkersAi, type WorkersAiBinding } from "./workers-ai";

export const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const EMBED_BATCH = 50;

export interface SearchHit {
  id: string;
  title: string;
  text: string;
  score: number;
}

export interface SearchResult {
  method: "embeddings" | "keyword";
  hits: SearchHit[];
}

async function embed(ai: WorkersAiBinding, texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const res = await ai.run(EMBEDDING_MODEL, { text: texts.slice(i, i + EMBED_BATCH) });
    if (!res.data || res.data.length !== Math.min(EMBED_BATCH, texts.length - i)) {
      throw new Error("Workers AI returned an unexpected embedding shape");
    }
    out.push(...res.data);
  }
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

// Corpus vectors are computed once per isolate and reused across requests.
let corpusVectors: Promise<number[][]> | null = null;

function getCorpusVectors(ai: WorkersAiBinding): Promise<number[][]> {
  if (!corpusVectors) {
    corpusVectors = embed(
      ai,
      KNOWLEDGE_CORPUS.map((c) => `${c.title}\n${c.text}`),
    ).catch((err) => {
      corpusVectors = null;
      throw err;
    });
  }
  return corpusVectors;
}

const STOPWORDS = new Set(
  "a an and are as at be by can do does for from how i in is it its my of on or our should so that the their this to we what when where which who why will with you your".split(
    " ",
  ),
);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function keywordSearch(
  query: string,
  corpus: readonly KnowledgeChunk[],
  k: number,
): SearchHit[] {
  const q = new Set(tokens(query));
  if (q.size === 0) return [];
  return corpus
    .map((c) => {
      const doc = tokens(`${c.title} ${c.text}`);
      const hits = doc.filter((t) => q.has(t)).length;
      return { ...c, score: hits / Math.sqrt(doc.length || 1) };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function searchGuidance(query: string, k = 4): Promise<SearchResult> {
  const ai = getWorkersAi();
  if (ai) {
    try {
      const [docs, [qv]] = await Promise.all([getCorpusVectors(ai), embed(ai, [query])]);
      const hits = KNOWLEDGE_CORPUS.map((c, i) => ({ ...c, score: cosine(qv, docs[i]) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
      return { method: "embeddings", hits };
    } catch (err) {
      console.error("Embedding search failed; using keyword search:", err);
    }
  }
  return { method: "keyword", hits: keywordSearch(query, KNOWLEDGE_CORPUS, k) };
}
