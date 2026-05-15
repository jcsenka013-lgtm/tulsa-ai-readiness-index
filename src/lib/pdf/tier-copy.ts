import type { ReadinessTier } from "@/types/assessment";

export const TIER_DISPLAY: Record<ReadinessTier, string> = {
  foundation: "Foundation",
  exploration: "Exploration",
  pilot: "Pilot",
  scale: "Scale",
};

/** Hero framing aligned with the on-screen results tier narrative. */
export function tierHeroParagraph(tier: ReadinessTier): string {
  switch (tier) {
    case "foundation":
      return (
        "Your overall readiness sits in the Foundation band — the systems, " +
        "governance, and operating rhythm that AI depends on are still taking shape. " +
        "That is not a judgment on ambition; it is a sequencing signal. The " +
        "fastest path to ROI here is not a flashy pilot — it is tightening the " +
        "basics so automation has something safe and repeatable to attach to."
      );
    case "exploration":
      return (
        "You are in the Exploration tier: enough structure exists to experiment, " +
        "but outcomes are not predictable yet. The right move is disciplined " +
        "discovery — narrow use-cases, clear owners, and honest measurement — " +
        "so the next dollar you spend on AI is informed by evidence, not hype."
      );
    case "pilot":
      return (
        "Pilot-tier readiness means the table is set: core controls, workable " +
        "processes, and leadership that will entertain scoped change. This is " +
        "the window where a well-bounded 90-day pilot can produce a defensible " +
        "business case instead of another abandoned tool."
      );
    case "scale":
      return (
        "Scale-tier scores signal an operation that can absorb AI across multiple " +
        "workstreams — security, data, change management, and budget are aligned " +
        "enough to compound returns. The work ahead is less about proving value " +
        "once and more about portfolio management: sequencing, governance at " +
        "scale, and continuous improvement."
      );
  }
}

export const TIER_BAR_COLOR: Record<ReadinessTier, string> = {
  foundation: "#b91c1c",
  exploration: "#c2410c",
  pilot: "#1d4ed8",
  scale: "#15803d",
};
