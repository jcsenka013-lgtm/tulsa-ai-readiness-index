import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import {
  SIGNATURE_EMAIL,
  SIGNATURE_NAME,
  SIGNATURE_PHONE,
} from "@/lib/email/branding";
import { getCalendly15MinWithUtm } from "@/lib/calendly-utm";
import { EmailLayout, EmailHeading } from "@/lib/email/templates/EmailLayout";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-url";
import { getResultsPageUrl } from "@/lib/products/results-url";
import { recommendedNextStepLabel } from "@/lib/email/helpers";
import type { ProductType, RecommendedNextStep } from "@/types/assessment";

export interface FollowUp72HourEmailProps {
  firstName: string;
  companyName: string;
  assessmentId: string;
  productType: ProductType;
  topOpportunity: string | null;
  topInsightTitle: string;
  recommendedNextStep: RecommendedNextStep;
  leadEmail: string;
}

export function FollowUp72HourEmail({
  firstName,
  companyName,
  assessmentId,
  productType,
  topOpportunity,
  topInsightTitle,
  recommendedNextStep,
  leadEmail,
}: FollowUp72HourEmailProps) {
  const resultsUrl = getResultsPageUrl(assessmentId, productType);
  const cal15 = getCalendly15MinWithUtm(productType, "email", { assessmentId });
  const greet = firstName.trim() || "there";
  const focus = topOpportunity ?? topInsightTitle;

  return (
    <EmailLayout
      previewText={`One opportunity from your ${companyName} assessment`}
      unsubscribeUrl={buildUnsubscribeUrl(leadEmail)}
    >
      <EmailHeading>One specific opportunity</EmailHeading>
      <Text style={p}>
        Hi {greet}, circling back on {companyName}. The clearest automation
        surface I see in your responses is around{" "}
        <strong>{focus}</strong> — that is usually where a short pilot can
        show ROI inside a quarter if we narrow scope deliberately.
      </Text>
      <Text style={p}>
        We still have you down for{" "}
        <strong>{recommendedNextStepLabel(recommendedNextStep)}</strong>. Want
        me to walk you through how to capture this? Reply to this email, or
        book 15 minutes here:
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Button href={cal15} style={btn}>
          Book 15 minutes
        </Button>
      </Section>
      <Text style={pMuted}>
        <a href={resultsUrl} style={link}>
          Open your results again
        </a>
      </Text>
      <Text style={signOff}>
        — {SIGNATURE_NAME}
        <br />
        Tulsa Applied AI LLC · {SIGNATURE_PHONE} ·{" "}
        <a href={`mailto:${SIGNATURE_EMAIL}`} style={link}>
          {SIGNATURE_EMAIL}
        </a>
      </Text>
    </EmailLayout>
  );
}

const p: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 16px",
};

const pMuted: React.CSSProperties = {
  ...p,
  fontSize: "14px",
};

const btn: React.CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 22px",
  display: "inline-block",
};

const signOff: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#334155",
  margin: "24px 0 0",
};

const link: React.CSSProperties = { color: "#2563eb" };
