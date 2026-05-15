import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getSiteUrl } from "@/lib/email/site-url";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION =
  "A free five-minute assessment for Oklahoma small and mid-sized businesses. Get your readiness score, a personalized ROI estimate, and a roadmap — delivered in a PDF you can share with your team.";

const defaultTitle = "Tulsa AI Readiness Index | Free Assessment for Oklahoma Small Businesses";

const site = getSiteUrl();
const metadataBase = site
  ? new URL(site)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: defaultTitle,
    template: "%s | Tulsa AI Readiness Index",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    url: site || undefined,
    siteName: "Tulsa AI Readiness Index",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tulsa Applied AI — AI Readiness Assessment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
