import { getSiteUrl } from "@/lib/email/site-url";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { ProductType, ReadinessTier, RecommendedNextStep } from "@/types/assessment";

function getProjectRefFromSupabaseUrl(): string | null {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!raw) return null;
    const host = new URL(raw).hostname;
    if (!host.endsWith(".supabase.co")) return null;
    return host.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function supabaseProjectDashboardUrl(): string {
  const ref = getProjectRefFromSupabaseUrl();
  const override = process.env.SUPABASE_DASHBOARD_PROJECT_URL?.replace(/\/$/, "");
  if (override) return override;
  if (ref) return `https://supabase.com/dashboard/project/${ref}`;
  return "";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export interface NewLeadSlackPayload {
  productType: ProductType;
  companyName: string | null;
  overallScore: number;
  tier: ReadinessTier;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  industryLabel: string;
  recommendedNextStep: RecommendedNextStep;
  recommendedNextStepLabel: string;
  biggestPriority: string | null;
  assessmentId: string;
}

async function postSlack(url: string | undefined, body: object): Promise<void> {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // fire-and-forget: never throw
  }
}

/**
 * New completed assessment — leads channel.
 */
function slackProductLabel(t: ProductType): string {
  return t === "copilot_readiness" ? "Copilot" : "AI Readiness";
}

export function notifyNewLead(data: NewLeadSlackPayload): void {
  const site = getSiteUrl();
  const path = PRODUCTS[data.productType].resultsPath(data.assessmentId);
  const resultsUrl = site ? `${site}${path}` : "";
  const dash = supabaseProjectDashboardUrl();
  const phone = data.phone?.trim() ? data.phone.trim() : "no phone";
  const lines = [
    `🎯 *[${slackProductLabel(data.productType)}] New lead:* ${data.companyName?.trim() || "Unknown company"}`,
    `*Score:* ${data.overallScore}/100 (${data.tier})`,
    `*Contact:* ${data.fullName?.trim() || "—"} — ${data.email ?? "no email"} — ${phone}`,
    `*Industry:* ${data.industryLabel}`,
    `*Recommended:* ${data.recommendedNextStepLabel}`,
    `*Biggest priority:* ${data.biggestPriority?.trim() ? truncate(data.biggestPriority.trim(), 400) : "—"}`,
    `*Links:* ${resultsUrl || "—"} | ${dash || "Supabase (configure NEXT_PUBLIC_SUPABASE_URL)"}`,
  ];

  void postSlack(process.env.SLACK_WEBHOOK_URL_LEADS, { text: lines.join("\n") });
}

export interface BookedCallSlackPayload {
  productType: ProductType;
  fullName: string | null;
  companyName: string | null;
}

export function notifyBookedCall(data: BookedCallSlackPayload): void {
  const name = data.fullName?.trim() || "Someone";
  const co = data.companyName?.trim() || "their company";
  void postSlack(process.env.SLACK_WEBHOOK_URL_LEADS, {
    text: `📞 *[${slackProductLabel(data.productType)}]* *${name}* from *${co}* just booked a discovery call`,
  });
}

export function notifyError(
  error: unknown,
  context: { assessmentId?: string; step?: string },
): void {
  const stack =
    error instanceof Error
      ? truncate(error.stack ?? error.message, 1200)
      : truncate(String(error), 1200);
  const parts = [
    `🚨 *Error*${context.step ? ` (${context.step})` : ""}`,
    context.assessmentId ? `*Assessment:* \`${context.assessmentId}\`` : "",
    "```",
    stack,
    "```",
  ].filter(Boolean);

  void postSlack(process.env.SLACK_WEBHOOK_URL_ERRORS, { text: parts.join("\n") });
}
