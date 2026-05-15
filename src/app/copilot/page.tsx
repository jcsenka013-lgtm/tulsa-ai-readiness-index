import Link from "next/link";

import { CopilotLandingAnalytics } from "@/app/copilot/CopilotLandingAnalytics";
import { CopilotTrackLink } from "@/app/copilot/CopilotTrackLink";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How long does this take?",
    a: "About seven minutes if you answer honestly — most people finish in one sitting.",
  },
  {
    q: "Is this really free?",
    a: "Yes. If you want hands-on help after, deeper Copilot deployment engagements start at $12,000 (Pilot) or roughly $5,000–$12,000 for Foundation work when gaps need fixing first.",
  },
  {
    q: "What if my M365 tenant is a mess?",
    a: "That is exactly what we help with. The assessment tells you straight whether to fix the foundation before buying more Copilot seats, or whether you can proceed safely now.",
  },
  {
    q: "Do I need to know the technical details?",
    a: "No. The questions are written for business owners and operators. Help text explains M365 terminology in plain English.",
  },
  {
    q: "What happens after I complete it?",
    a: "You see results immediately, receive a PDF by email, and can optionally book a 30-minute discovery call if you want to talk through the roadmap.",
  },
  {
    q: "Will I end up on a sales list?",
    a: "You will get a short 7-day follow-up sequence. Unsubscribe anytime. After that, silence unless you reach out to us.",
  },
];

function HeroResultsMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-blue-200/80 bg-white/90 shadow-xl shadow-blue-600/10 ring-1 ring-blue-600/5 motion-safe:transition motion-safe:duration-300"
      aria-hidden="true"
    >
      <div className="border-b border-border bg-blue-50/80 px-4 py-2 text-xs font-medium text-blue-800">
        Readiness snapshot
      </div>
      <div className="space-y-3 p-4 blur-[3px] motion-reduce:blur-none">
        <div className="flex justify-between gap-2">
          <span className="h-3 w-24 rounded bg-slate-200" />
          <span className="h-3 w-8 rounded bg-blue-200" />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[58%] rounded-full bg-blue-600" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-slate-100" />
          <div className="h-2 w-[85%] rounded bg-slate-100" />
          <div className="h-2 w-[70%] rounded bg-slate-100" />
        </div>
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-2 text-[10px] text-amber-950">
          M365 gap: permissions &amp; labels
        </div>
      </div>
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/20 to-transparent text-center text-xs font-medium text-slate-600 motion-reduce:hidden">
        Sample results preview
      </p>
    </div>
  );
}

export default function CopilotLandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <CopilotLandingAnalytics />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="border-b border-blue-100/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold text-slate-900">Tulsa Applied AI</span>
          <CopilotTrackLink
            href="/copilot/assessment"
            eventName="copilot_assessment_started"
            eventProps={{ source: "landing" }}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            Start assessment
          </CopilotTrackLink>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* Hero */}
        <section
          className="relative border-b border-blue-100/60 bg-gradient-to-b from-blue-50 via-white to-white"
          aria-labelledby="copilot-hero-heading"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center md:py-16 lg:gap-14">
            <div className="space-y-6">
              <p className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
                Microsoft 365 Copilot readiness
              </p>
              <h1
                id="copilot-hero-heading"
                className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight"
              >
                Is your business actually ready for Copilot?
              </h1>
              <p className="text-pretty text-lg text-slate-600">
                Microsoft 365 Copilot costs $18/user/month on the current promo. But 73% of
                deployments fail in the first month — not because of Copilot, but because the M365
                foundation wasn&apos;t ready. This 7-minute assessment tells you where you stand
                before you commit.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <CopilotTrackLink
                  href="/copilot/assessment"
                  eventName="copilot_assessment_started"
                  eventProps={{ source: "landing" }}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-blue-600 text-white hover:bg-blue-700",
                  )}
                >
                  Start the readiness assessment
                </CopilotTrackLink>
                <Link
                  href="/copilot/sample-report"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-blue-200 text-blue-800 hover:bg-blue-50",
                  )}
                >
                  See a sample report
                </Link>
              </div>
            </div>
            <HeroResultsMockup />
          </div>
        </section>

        {/* Urgency */}
        <section
          id="urgency"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
          aria-labelledby="urgency-heading"
        >
          <h2
            id="urgency-heading"
            className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            The Copilot decision can&apos;t wait, but the foundation can&apos;t be rushed
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-semibold tabular-nums text-blue-600">
                  $18/user/mo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Copilot Business promo rate, ends June 30, 2026. After that: $21/user/month (17%
                increase).
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-semibold tabular-nums text-blue-600">73%</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Of Copilot deployments fail in the first month, typically due to unmet M365
                prerequisites.
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-semibold tabular-nums text-blue-600">340+</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                The average number of overshared SharePoint sites per organization. Copilot will
                surface them all.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Failure modes */}
        <section
          id="failure-modes"
          className="border-y border-slate-200/80 bg-slate-50/50 scroll-mt-20"
          aria-labelledby="failure-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2
              id="failure-heading"
              className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              What &apos;not ready&apos; actually looks like
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Copilot saw my salary",
                  body: "Finance documents surface to all employees because SharePoint permissions were never audited.",
                },
                {
                  title: "Layoff rumors confirmed by AI",
                  body: "HR Teams site accidentally public; Copilot answers employee questions from it.",
                },
                {
                  title: "25 licenses, 3 users",
                  body: "Seats purchased before prerequisites were met, rollout stalls, licenses expire unused at $450/seat wasted.",
                },
                {
                  title: "The chatbot lied about our pricing",
                  body: "Stale documents in SharePoint; Copilot confidently quotes outdated rates to prospects.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">{item.body}</CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-10 max-w-3xl text-pretty text-sm text-slate-600">
              These aren&apos;t hypothetical. They&apos;re the four patterns every Microsoft partner has
              seen. The difference between success and disaster is whether you verify readiness
              before deploying.
            </p>
          </div>
        </section>

        {/* What you get */}
        <section
          id="what-you-get"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
          aria-labelledby="deliver-heading"
        >
          <h2
            id="deliver-heading"
            className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
          >
            What the assessment delivers
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your readiness score across five dimensions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Data security, process maturity, tech infrastructure, team readiness, and financial
                alignment — scored in one view.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">A specific M365 gap analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Copilot readiness status, top compliance gaps with remediation paths, and recommended
                upgrades with licensing implications.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">A personalized roadmap PDF</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Your score, gaps, ROI estimate, and a clear next step you can share with your team.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Who it's for */}
        <section
          id="who-its-for"
          className="border-t border-slate-200/80 bg-white scroll-mt-20"
          aria-labelledby="who-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2
              id="who-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              Who this assessment is designed for
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-slate-900">Already on M365</h3>
                <p className="mt-2 text-sm text-slate-600">
                  You have Business Basic, Standard, Premium, or E3/E5. Without M365, Copilot
                  Business isn&apos;t even an option.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">5–50 employees</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Smaller than that, you probably don&apos;t need formal governance. Bigger than that,
                  you need enterprise-scale guidance beyond what this free tool provides.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Considering or already bought Copilot</h3>
                <p className="mt-2 text-sm text-slate-600">
                  You&apos;re in evaluation, or you already have licenses and want to verify you&apos;re
                  rolling out safely.
                </p>
              </div>
            </div>
            <p className="mt-10 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              If you&apos;re not on Microsoft 365, take the{" "}
              <Link href="/" className="font-medium text-blue-600 underline-offset-4 hover:underline">
                general AI Readiness Assessment
              </Link>{" "}
              instead.
            </p>
          </div>
        </section>

        {/* Sample insights */}
        <section
          id="insights"
          className="border-t border-blue-100/80 bg-blue-50/30 scroll-mt-20"
          aria-labelledby="insights-heading"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2
              id="insights-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
            >
              A preview of what we&apos;ll tell you
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Card className="border-red-200/80 bg-white">
                <CardHeader className="pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Critical
                  </span>
                  <CardTitle className="text-base text-slate-900">
                    SharePoint permissions unknown = Copilot blast radius unknown
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-amber-200/80 bg-white">
                <CardHeader className="pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Warning
                  </span>
                  <CardTitle className="text-base text-slate-900">
                    Purview sensitivity labels not deployed — most common SMB gap
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-emerald-200/80 bg-white">
                <CardHeader className="pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Opportunity
                  </span>
                  <CardTitle className="text-base text-slate-900">
                    Copilot promotional pricing window closes June 30 — budget accordingly
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6"
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="text-xl font-semibold text-slate-900">
            About Tulsa Applied AI
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-slate-600">
            Tulsa Applied AI is an Oklahoma-based specialist in M365 governance and AI readiness for
            small and mid-sized businesses. We serve Tulsa, Oklahoma City, and surrounding regions.
            Most &quot;AI consultants&quot; don&apos;t know M365 admin center. Most MSPs sell M365 seats
            without touching Purview. We sit in that gap.
          </p>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="border-t border-slate-200/80 bg-slate-50/40 scroll-mt-20"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <h2 id="faq-heading" className="text-2xl font-semibold text-slate-900">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg border border-slate-200 bg-white px-4 py-1 shadow-sm open:pb-3 open:shadow-md motion-safe:transition-shadow"
                >
                  <summary className="cursor-pointer list-none py-3 font-medium text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      {item.q}
                      <span className="text-blue-600 motion-safe:transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="start"
          className="border-t border-blue-100 bg-gradient-to-b from-blue-50 to-white scroll-mt-20"
          aria-labelledby="final-cta-heading"
        >
          <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <h2 id="final-cta-heading" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Ready to see where you stand?
            </h2>
            <CopilotTrackLink
              href="/copilot/assessment"
              eventName="copilot_assessment_started"
              eventProps={{ source: "landing" }}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              Start the 7-minute assessment
            </CopilotTrackLink>
            <p className="mt-4 text-sm text-slate-600">
              Free. No credit card. Results in under 10 minutes.
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter
        crossPromo={{ href: "/", label: "General AI Readiness Index" }}
        disclosureNote="Tulsa Applied AI is an independent consultancy. We are not a Microsoft Partner or reseller. Pricing information is current as of April 23, 2026 and sourced from Microsoft's published documentation."
      />
    </div>
  );
}
