import { render } from "@react-email/render";
import { Resend } from "resend";
import type * as React from "react";

import { createServiceClient } from "@/lib/supabase/server";
import type { EmailType } from "@/lib/email/email-types";

let resendSingleton: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "results@tulsaappliedai.com";
}

export interface SendEmailParams {
  to: string;
  subject: string;
  reactElement: React.ReactElement;
  assessmentId: string;
  emailType: EmailType;
}

export type SendEmailResult =
  | { outcome: "skipped" }
  | { outcome: "sent"; messageId: string }
  | { outcome: "failed"; error: string };

/**
 * Sends a React Email via Resend, respecting unsubscribes and idempotent
 * `email_log` rows (unique per assessment + email type).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const to = params.to.trim().toLowerCase();
  if (!to) {
    return { outcome: "failed", error: "Missing recipient" };
  }

  const supabase = createServiceClient();

  const { data: unsub } = await supabase
    .from("unsubscribes")
    .select("email")
    .eq("email", to)
    .maybeSingle();
  if (unsub) {
    return { outcome: "skipped" };
  }

  const { data: existingLog } = await supabase
    .from("email_log")
    .select("id")
    .eq("assessment_id", params.assessmentId)
    .eq("email_type", params.emailType)
    .maybeSingle();
  if (existingLog) {
    return { outcome: "skipped" };
  }

  const resend = getResend();
  if (!resend) {
    const msg = "RESEND_API_KEY is not configured";
    await supabase.from("email_log").insert({
      assessment_id: params.assessmentId,
      lead_email: to,
      email_type: params.emailType,
      status: "failed",
      error_message: msg,
    });
    return { outcome: "failed", error: msg };
  }

  let html: string;
  try {
    html = await render(params.reactElement);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("email_log").insert({
      assessment_id: params.assessmentId,
      lead_email: to,
      email_type: params.emailType,
      status: "failed",
      error_message: `render: ${msg}`,
    });
    return { outcome: "failed", error: msg };
  }

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject: params.subject,
    html,
  });

  if (error) {
    const msg = error.message ?? JSON.stringify(error);
    await supabase.from("email_log").insert({
      assessment_id: params.assessmentId,
      lead_email: to,
      email_type: params.emailType,
      status: "failed",
      error_message: msg,
    });
    return { outcome: "failed", error: msg };
  }

  const messageId = data?.id ?? "";
  await supabase.from("email_log").insert({
    assessment_id: params.assessmentId,
    lead_email: to,
    email_type: params.emailType,
    status: "sent",
    resend_message_id: messageId || null,
  });

  return { outcome: "sent", messageId };
}
