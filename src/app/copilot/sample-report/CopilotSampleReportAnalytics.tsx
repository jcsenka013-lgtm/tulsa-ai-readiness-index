"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";

export function CopilotSampleReportAnalytics() {
  useEffect(() => {
    trackEvent("copilot_sample_report_viewed");
  }, []);
  return null;
}
