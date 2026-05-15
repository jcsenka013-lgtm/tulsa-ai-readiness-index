"use client";

import { useEffect } from "react";

import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";

export function AiLandingAnalytics() {
  useEffect(() => {
    trackFunnel(FUNNEL.landingViewed, "ai_readiness");
  }, []);
  return null;
}
