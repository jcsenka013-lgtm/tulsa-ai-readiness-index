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
import { getSiteUrl } from "@/lib/email/site-url";
import { getResultsPageUrl } from "@/lib/products/results-url";
import {
  recommendedNextStepLabel,
  tierAccentColor,
  tierDisplayName,
  tierResultsFraming,
} from "@/lib/email/helpers";
import type { ProductType, ReadinessTier, RecommendedNextStep } from "@/types/assessment";

export interface ResultsReadyEmailProps {
  firstName: string;
  companyName: string;
  assessmentId: string;
  productType: ProductType;
  tier: ReadinessTier;
  overallScore: number;
  topInsights: { title: string; line: string }[];
  recommendedNextStep: RecommendedNextStep;
  /** Lowercased work email — used for unsubscribe link only */
  leadEmail: string;
}

export function ResultsReadyEmail({
  firstName,
  companyName,
  assessmentId,
  productType,
  tier,
  overallScore,
  topInsights,
  recommendedNextStep,
  leadEmail,
}: ResultsReadyEmailProps) {
  const site = getSiteUrl();
  const resultsUrl = getResultsPageUrl(assessmentId, productType);
  const pdfUrl = `${site}/api/assessment/${assessmentId}/pdf`;
  const calUrl = getDiscoveryCalendlyWithUtm(productType, "email", {
    assessmentId,
  });
  const accent = tierAccentColor(tier);
  const greet = firstName.trim() || "there";

  return (
    <EmailLayout
      previewText={`Your AI readiness results for ${companyName}`}
      unsubscribeUrl={buildUnsubscribeUrl(leadEmail)}
    >
      <EmailHeading>Your results are ready</EmailHeading>
      <Text style={p}>
        Hi {greet}, nice work completing the assessment.
      </Text>
      <Section style={{ ...scoreCard, borderLeftColor: accent }}>
        <Text style={{ ...scoreLabel, color: accent }}>{tierDisplayName(tier)} tier</Text>
        <Text style={scoreNumber}>{overallScore}</Text>
        <Text style={scoreCaption}>Overall readiness (0–100)</Text>
      </Section>
      <Text style={p}>{tierResultsFraming(tier)}</Text>
      <Text style={subhead}>Top 2 things we&apos;re seeing</Text>
      {topInsights.slice(0, 2).map((i) => (
        <Section key={i.title} style={insightBlock}>
          <Text style={insightTitle}>{i.title}</Text>
          <Text style={insightLine}>{i.line}</Text>
        </Section>
      ))}
      <Text style={p}>
        <strong>Recommended next step:</strong>{" "}
        {recommendedNextStepLabel(recommendedNextStep)}
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href={resultsUrl} style={btnPrimary}>
          View your full results
        </Button>
      </Section>
      <Section style={{ textAlign: "center" as const, margin: "12px 0" }}>
        <Button href={pdfUrl} style={btnSecondary}>
          Download PDF report
        </Button>
      </Section>
      <Section style={{ textAlign: "center" as const, margin: "12px 0 28px" }}>
        <Button href={calUrl} style={btnTertiary}>
          Book a 30-minute discovery call
        </Button>
      </Section>
      <Text style={signOff}>
        — {SIGNATURE_NAME}
        <br />
        Tulsa Applied AI LLC
        <br />
        {SIGNATURE_PHONE} ·{" "}
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

const subhead: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#0f172a",
  margin: "20px 0 8px",
};

const scoreCard: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  borderLeftWidth: "4px",
  borderLeftStyle: "solid",
  padding: "16px 20px",
  margin: "16px 0",
};

const scoreLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 4px",
};

const scoreNumber: React.CSSProperties = {
  fontSize: "40px",
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
  lineHeight: 1,
};

const scoreCaption: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  margin: "8px 0 0",
};

const insightBlock: React.CSSProperties = {
  marginBottom: "12px",
};

const insightTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  margin: "0 0 4px",
};

const insightLine: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#475569",
  margin: 0,
};

const btnPrimary: React.CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "#ffffff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
};

const btnTertiary: React.CSSProperties = {
  ...btnSecondary,
  fontWeight: 500,
};

const signOff: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#334155",
  margin: "8px 0 0",
};

const link: React.CSSProperties = { color: "#2563eb" };
