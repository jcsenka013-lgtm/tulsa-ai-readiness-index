"use client";

import { useEffect } from "react";

import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";
import { trackEvent } from "@/lib/analytics";

export function CopilotLandingAnalytics() {
  useEffect(() => {
    trackFunnel(FUNNEL.landingViewed, "copilot_readiness");
    trackEvent("copilot_landing_viewed", { product_type: "copilot_readiness" });
  }, []);
  return null;
}
