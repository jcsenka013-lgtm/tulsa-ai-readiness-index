import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tulsa Applied AI helps Oklahoma small and mid-sized businesses adopt Microsoft 365 Copilot and practical AI with clarity and guardrails.",
};

const SERVICES = [
  {
    name: "Foundation",
    blurb: "Triage, policies, and tenant hygiene so you can try Copilot and automation without creating new data liability.",
  },
  {
    name: "Readiness audit",
    blurb: "Structured assessment of M365, workflows, and compliance context — the same rigor as this index, tailored to your firm.",
  },
  {
    name: "Pilot",
    blurb: "One workflow, one success metric, ninety days. We help you pick the first win and measure it credibly.",
  },
  {
    name: "Partnership",
    blurb: "Ongoing cadence: roadmap, vendor coordination, and quarterly reviews for teams moving past a single experiment.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            About Tulsa Applied AI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Tulsa, Oklahoma</p>

          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Tulsa Applied AI is a local consultancy focused on practical AI
              adoption for organizations that do real work in Microsoft 365. We
              are not a national lead-gen shop — we are part of the Tulsa
              business community and we optimize for long-term client outcomes, not
              one-call closes.
            </p>
            <p>
              The founder&rsquo;s background is in the managed services world —
              from field work on networks and devices through tenant-wide security
              and compliance programs. That ground-level experience shaped how
              this readiness index is written: the questions reflect what
              actually breaks on the way to Copilot, not what sounds good in a
              vendor slide deck.
            </p>
            <p>
              Oklahoma has thousands of sub-100-employee companies in healthcare,
              professional services, energy, and local industry. They deserve
              the same quality of technology guidance larger coastal firms take
              for granted — with language that respects general managers and
              owners who do not live in the Microsoft admin center every day.
            </p>
          </div>

          <h2 className="mt-12 text-xl font-semibold text-foreground">How we work with clients</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <Card key={s.name} className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {s.blurb}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mt-12 text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            <a
              className="font-medium text-foreground underline"
              href="mailto:info@tulsaappliedai.com"
            >
              info@tulsaappliedai.com
            </a>
            <br />
            Tulsa, Oklahoma
          </p>
          <div className="mt-8">
            <Link
              href="/assessment"
              className={cn(buttonVariants({ size: "lg" }), "group inline-flex gap-2")}
            >
              Start the free assessment
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
