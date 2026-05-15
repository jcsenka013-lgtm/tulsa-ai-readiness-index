import type { ProductType } from "@/types/assessment";

export interface ProductConfig {
  slug: ProductType;
  name: string;
  shortName: string;
  /** Empty string for the primary (AI) product, `/copilot` for the Copilot product. */
  urlPrefix: string;
  assessmentPath: string;
  resultsPath: (id: string) => string;
  tagline: string;
  /** Tailwind color token (no `text-` prefix) for UI accents, e.g. `slate`, `blue`. */
  accentColor: string;
  estimatedMinutes: number;
  heroBadge: string;
}

export const PRODUCTS: Record<ProductType, ProductConfig> = {
  ai_readiness: {
    slug: "ai_readiness",
    name: "Tulsa AI Readiness Index",
    shortName: "AI Readiness Index",
    urlPrefix: "",
    assessmentPath: "/assessment",
    resultsPath: (id) => `/results/${id}`,
    tagline:
      "A five-minute assessment across five dimensions of AI readiness",
    accentColor: "slate",
    estimatedMinutes: 5,
    heroBadge: "GENERAL AI READINESS",
  },
  copilot_readiness: {
    slug: "copilot_readiness",
    name: "Tulsa Copilot Readiness Assessment",
    shortName: "Copilot Readiness",
    urlPrefix: "/copilot",
    assessmentPath: "/copilot/assessment",
    resultsPath: (id) => `/copilot/results/${id}`,
    tagline: "Is your Microsoft 365 tenant actually ready for Copilot?",
    accentColor: "blue",
    estimatedMinutes: 7,
    heroBadge: "MICROSOFT 365 COPILOT READINESS",
  },
};
