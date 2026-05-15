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
import { recommendedNextStepLabel, tierDisplayName } from "@/lib/email/helpers";
import type { ProductType, ReadinessTier, RecommendedNextStep } from "@/types/assessment";

export interface FollowUp24HourEmailProps {
  firstName: string;
  companyName: string;
  assessmentId: string;
  productType: ProductType;
  tier: ReadinessTier;
  topInsightTitle: string;
  recommendedNextStep: RecommendedNextStep;
  leadEmail: string;
}

export function FollowUp24HourEmail({
  firstName,
  companyName,
  assessmentId,
  productType,
  tier,
  topInsightTitle,
  recommendedNextStep,
  leadEmail,
}: FollowUp24HourEmailProps) {
  const resultsUrl = getResultsPageUrl(assessmentId, productType);
  const calUrl = getDiscoveryCalendlyWithUtm(productType, "email", {
    assessmentId,
  });
  const greet = firstName.trim() || "there";
  const tierName = tierDisplayName(tier);

  return (
    <EmailLayout
      previewText={`A quick follow-up on your ${companyName} assessment`}
      unsubscribeUrl={buildUnsubscribeUrl(leadEmail)}
    >
      <EmailHeading>Quick thought on your results</EmailHeading>
      <Text style={p}>
        Hi {greet}, I was looking back at your {companyName} assessment. You
        landed in the <strong>{tierName}</strong> band — that usually means the
        wins are there, but sequencing matters so you do not burn budget on the
        wrong automation first.
      </Text>
      <Text style={p}>
        The headline signal for me was around <strong>{topInsightTitle}</strong>.
        We suggested <strong>{recommendedNextStepLabel(recommendedNextStep)}</strong>{" "}
        as the next move; if you want a second pair of eyes on whether that
        still matches how your week actually runs, happy to talk it through.
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Button href={calUrl} style={btn}>
          Grab a time on my calendar
        </Button>
      </Section>
      <Text style={pMuted}>
        Prefer the written report first?{" "}
        <a href={resultsUrl} style={link}>
          View your full results
        </a>
        .
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
  color: "#64748b",
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
