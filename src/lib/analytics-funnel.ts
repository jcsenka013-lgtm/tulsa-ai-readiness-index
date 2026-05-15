import { trackEvent } from "@/lib/analytics";
import type { ProductType } from "@/types/assessment";

/** Standard funnel event names (wire destinations to this shape in GTM, etc.) */
export const FUNNEL = {
  landingViewed: "funnel_landing_viewed",
  assessmentStarted: "funnel_assessment_started",
  assessmentCompleted: "funnel_assessment_completed",
  resultsViewed: "funnel_results_viewed",
  discoveryCallBooked: "funnel_discovery_call_booked",
  /** Reserved for CRM/contracting integration — call when a closed deal is recorded */
  engagementSigned: "funnel_engagement_signed",
} as const;

type FunnelName = (typeof FUNNEL)[keyof typeof FUNNEL];

export function trackFunnel(
  name: FunnelName,
  productType: ProductType,
  extra?: Record<string, string | number | boolean | null>,
): void {
  trackEvent(name, {
    product_type: productType,
    ...extra,
  });
}
