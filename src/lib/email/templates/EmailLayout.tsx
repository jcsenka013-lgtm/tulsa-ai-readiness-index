import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import {
  BUSINESS_ADDRESS,
  SUPPORT_EMAIL,
} from "@/lib/email/branding";

interface EmailLayoutProps {
  previewText: string;
  unsubscribeUrl: string;
  children: React.ReactNode;
}

export function EmailLayout({
  previewText,
  unsubscribeUrl,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={wordmark}>
            <Text style={wordmarkText}>Tulsa Applied AI</Text>
            <Text style={tagline}>AI Readiness Index</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Tulsa Applied AI LLC · {BUSINESS_ADDRESS}
            <br />
            <Link href={unsubscribeUrl} style={linkMuted}>
              Unsubscribe from assessment emails
            </Link>
            {" · "}
            <Link href={`mailto:${SUPPORT_EMAIL}`} style={linkMuted}>
              {SUPPORT_EMAIL}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,sans-serif',
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px 16px 48px",
  maxWidth: "560px",
};

const wordmark: React.CSSProperties = {
  marginBottom: "24px",
};

const wordmarkText: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 4px",
  letterSpacing: "-0.02em",
};

const tagline: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  margin: 0,
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "28px 0 16px",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#71717a",
  margin: 0,
};

const linkMuted: React.CSSProperties = {
  color: "#52525b",
  textDecoration: "underline",
};

export function EmailHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Heading as="h1" style={h1}>
      {children}
    </Heading>
  );
}

const h1: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#0f172a",
  lineHeight: "1.3",
  margin: "0 0 16px",
};
