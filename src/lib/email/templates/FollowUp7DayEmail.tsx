import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import {
  SIGNATURE_EMAIL,
  SIGNATURE_NAME,
  SIGNATURE_PHONE,
} from "@/lib/email/branding";
import { getDiscoveryCalendlyWithUtm } from "@/lib/calendly-utm";
import { EmailLayout, EmailHeading } from "@/lib/email/templates/EmailLayout";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-url";
import { getResultsPageUrl } from "@/lib/products/results-url";
import type { ProductType } from "@/types/assessment";

export interface FollowUp7DayEmailProps {
  firstName: string;
  companyName: string;
  assessmentId: string;
  productType: ProductType;
  leadEmail: string;
}

export function FollowUp7DayEmail({
  firstName,
  companyName,
  assessmentId,
  productType,
  leadEmail,
}: FollowUp7DayEmailProps) {
  const resultsUrl = getResultsPageUrl(assessmentId, productType);
  const calUrl = getDiscoveryCalendlyWithUtm(productType, "email", { assessmentId });
  const greet = firstName.trim() || "there";

  return (
    <EmailLayout
      previewText={`Last note on your assessment — ${companyName}`}
      unsubscribeUrl={buildUnsubscribeUrl(leadEmail)}
    >
      <EmailHeading>Last note on your AI Readiness Assessment</EmailHeading>
      <Text style={p}>
        Hi {greet}, I won&apos;t keep pestering you about the {companyName}{" "}
        results. If the timing isn&apos;t right, save this email — it&apos;ll
        still be relevant in six months when budgets free up.
      </Text>
      <Text style={p}>
        When you are ready to pressure-test the roadmap with someone who does
        this every week, you can grab time here — no prep required on your
        side:
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Button href={calUrl} style={btn}>
          Book when you are ready
        </Button>
      </Section>
      <Text style={pMuted}>
        <a href={resultsUrl} style={link}>
          Your results page
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
