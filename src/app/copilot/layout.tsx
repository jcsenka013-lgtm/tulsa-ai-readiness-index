import type { Metadata, Viewport } from "next";

import { CopilotChrome } from "@/app/copilot/CopilotChrome";
import { getSiteUrl } from "@/lib/email/site-url";

const TITLE =
  "Tulsa Copilot Readiness Assessment | Is your M365 tenant ready for Copilot?";

const DESCRIPTION =
  "A 7-minute assessment for Oklahoma businesses considering Microsoft 365 Copilot. Get your readiness score, see your specific M365 gaps, and learn whether to buy seats now or fix your foundation first.";

const KEYWORDS = [
  "Microsoft 365 Copilot",
  "Oklahoma",
  "Tulsa",
  "readiness assessment",
  "M365 governance",
  "Copilot prerequisites",
];

const site = getSiteUrl();
const metadataBase = site ? new URL(site) : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: TITLE,
    template: "%s | Copilot Readiness",
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: site ? `${site}/copilot` : undefined,
    siteName: "Tulsa Copilot Readiness Assessment",
    locale: "en_US",
    images: [
      {
        url: "/og-copilot.png",
        width: 1200,
        height: 630,
        alt: "Tulsa Applied AI — Copilot Readiness Assessment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-copilot.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function CopilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CopilotChrome>{children}</CopilotChrome>;
}
