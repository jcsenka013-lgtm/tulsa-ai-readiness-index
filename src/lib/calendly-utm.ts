import { getCalendly15MinUrl, getCalendlyDiscoveryUrl } from "@/lib/email/branding";
import type { ProductType } from "@/types/assessment";

export type CalendlyUtmContext = "email" | "web" | "pdf" | "results_cta";

/**
 * Appends UTM parameters so Calendly attribution can be split by product
 * in reporting (source / medium / campaign = product slug).
 */
export function getDiscoveryCalendlyWithUtm(
  productType: ProductType,
  context: CalendlyUtmContext,
  extra?: { assessmentId?: string },
): string {
  const base = getCalendlyDiscoveryUrl();
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    u = new URL("https://calendly.com/");
  }
  u.searchParams.set("utm_source", "tulsa_applied_ai");
  u.searchParams.set("utm_medium", context);
  u.searchParams.set("utm_campaign", productType);
  if (extra?.assessmentId) {
    u.searchParams.set("utm_content", extra.assessmentId);
  }
  return u.toString();
}

export function getCalendly15MinWithUtm(
  productType: ProductType,
  context: CalendlyUtmContext,
  extra?: { assessmentId?: string },
): string {
  const base = getCalendly15MinUrl();
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    u = new URL("https://calendly.com/");
  }
  u.searchParams.set("utm_source", "tulsa_applied_ai");
  u.searchParams.set("utm_medium", context);
  u.searchParams.set("utm_campaign", productType);
  if (extra?.assessmentId) {
    u.searchParams.set("utm_content", extra.assessmentId);
  }
  return u.toString();
}
