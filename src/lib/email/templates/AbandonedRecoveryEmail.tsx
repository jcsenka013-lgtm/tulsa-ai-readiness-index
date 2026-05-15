import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import {
  SIGNATURE_EMAIL,
  SIGNATURE_NAME,
  SIGNATURE_PHONE,
} from "@/lib/email/branding";
import { EmailLayout, EmailHeading } from "@/lib/email/templates/EmailLayout";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-url";
import { getSiteUrl } from "@/lib/email/site-url";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { ProductType } from "@/types/assessment";

export interface AbandonedRecoveryEmailProps {
  firstName?: string;
  assessmentId: string;
  productType: ProductType;
  leadEmail: string;
}

export function AbandonedRecoveryEmail({
  firstName,
  assessmentId,
  productType,
  leadEmail,
}: AbandonedRecoveryEmailProps) {
  const site = getSiteUrl();
  const resumeUrl = `${site}${PRODUCTS[productType].assessmentPath}/${assessmentId}`;
  const greet = firstName?.trim() ? firstName.trim() : "there";

  return (
    <EmailLayout
      previewText="Finish your AI Readiness Assessment in about 3 minutes"
      unsubscribeUrl={buildUnsubscribeUrl(leadEmail)}
    >
      <EmailHeading>Pick up where you left off</EmailHeading>
      <Text style={p}>
        Hi {greet}, you started your readiness assessment but didn&apos;t
        finish. It takes about three more minutes to get your scored report,
        ROI range, and next-step recommendation.
      </Text>
      <Section style={{ textAlign: "center" as const, margin: "28px 0" }}>
        <Button href={resumeUrl} style={btn}>
          Finish the assessment
        </Button>
      </Section>
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
