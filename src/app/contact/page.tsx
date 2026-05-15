import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Tulsa Applied AI about the AI Readiness Index and consulting services.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Contact
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tulsa Applied AI LLC · Tulsa, Oklahoma
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            For questions about the assessment, privacy, or working together,
            email us. If you are booking a scoping call, you can also use the
            Calendly link you receive after the assessment in many cases.
          </p>
          <a
            href="mailto:info@tulsaappliedai.com"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "mt-8 inline-flex gap-2",
            )}
          >
            <Mail className="h-4 w-4" />
            info@tulsaappliedai.com
          </a>
          <p className="mt-8 text-sm text-muted-foreground">
            Prefer to start on your own?{" "}
            <Link className="font-medium text-foreground underline" href="/assessment">
              Take the free assessment
            </Link>
            .
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
