import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileText,
  Landmark,
  LayoutList,
  LineChart,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { AiLandingAnalytics } from "@/components/marketing/AiLandingAnalytics";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FIVE_DOMAINS = [
  {
    icon: Shield,
    title: "Data Security & Compliance",
    body: "Do your Purview policies, sensitivity labels, and access controls protect you when AI gets access?",
  },
  {
    icon: LayoutList,
    title: "Operational Process Maturity",
    body: "Are your workflows documented enough that AI can actually help automate them?",
  },
  {
    icon: Cpu,
    title: "Technology Infrastructure",
    body: "Is your M365 tenant configured to support Copilot, or will it create new risks?",
  },
  {
    icon: Users,
    title: "Team & Change Management",
    body: "Will your team adopt AI tools, or will they rebel?",
  },
  {
    icon: Landmark,
    title: "Financial & Strategic Alignment",
    body: "Do you have a clear, funded plan — or are you chasing AI because the trade press told you to?",
  },
] as const;

const BENEFITS = [
  {
    icon: BarChart3,
    title: "Score across five dimensions",
    description: (
      <>
        See how you rate on:{" "}
        <span className="text-foreground">
          Data security &amp; compliance; operational process maturity; technology
          infrastructure; team &amp; change management; financial &amp; strategic
          alignment
        </span>
        .
      </>
    ),
  },
  {
    icon: LineChart,
    title: "Custom ROI estimate",
    description:
      "Industry-aware model — we show the math: labor baseline, automation potential, suggested investment, and first-year net savings range.",
  },
  {
    icon: FileText,
    title: "Personalized M365 roadmap",
    description:
      "The differentiator: compliance gaps, Copilot readiness, license upgrade recommendations, and quick wins you can act on this quarter — in a PDF you can hand to your IT provider or leadership team.",
  },
] as const;

const TRUST = [
  "Designed for 5–50 employee businesses",
  "Specific guidance for HIPAA, GLBA, and bar-regulated firms",
  "Built by Tulsa Applied AI — local, not a Silicon Valley chatbot",
  "Your data is confidential. No spam. No hard sell.",
] as const;

const FAQS = [
  {
    q: "How long does this take?",
    a: "Plan on 5–7 minutes — a bit more if you pause to look up how your M365 tenant is set up.",
  },
  {
    q: "What do I get at the end?",
    a: "Your readiness score, a custom ROI range, written insights, and a downloadable PDF report you can share.",
  },
  {
    q: "Do I need to be technical?",
    a: "No. We translate the Microsoft and compliance terminology into plain language for owners and GMs.",
  },
  {
    q: "Who sees my data?",
    a: "Tulsa Applied AI only, for delivering your results and light follow-up. It is not sold or shared for unrelated marketing.",
  },
  {
    q: "Is this really free?",
    a: "Yes — the self-serve assessment and PDF are free. If you want hands-on work after that, most deeper engagements start at $2,500 depending on scope.",
  },
  {
    q: "What if I use Google Workspace instead?",
    a: "You will still get a useful score: the framework is platform-agnostic, but the most specific playbooks and gap analysis are written for Microsoft 365.",
  },
  {
    q: "Will I be on a sales list?",
    a: "We may send a short follow-up sequence over about seven days. You can unsubscribe anytime, and we stop — no years-long drip campaign.",
  },
] as const;

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-border py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-4 text-left text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AiLandingAnalytics />
      <MarketingHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,theme(colors.primary/8%),transparent_60%)]" />
            <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -right-32 top-48 h-80 w-80 rounded-full bg-foreground/[0.04] blur-3xl" />
          </div>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="text-foreground">Free</span>
                <span aria-hidden className="text-border">·</span>
                <span>5 minutes</span>
                <span aria-hidden className="text-border">·</span>
                <span>No credit card</span>
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.05] md:text-6xl">
                Is your business ready for{" "}
                <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                  Microsoft 365 Copilot
                </span>{" "}
                and AI?
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A free five-minute assessment for Oklahoma small and mid-sized
                businesses. Get your readiness score, a personalized ROI estimate,
                and a roadmap — delivered in a PDF you can share with your team.
              </p>
              <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center">
                <Link
                  href="/assessment"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group inline-flex h-12 justify-center px-6 text-base shadow-sm shadow-primary/10 sm:w-auto",
                  )}
                >
                  Start the assessment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/sample-report"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 border-border px-6 text-base",
                  )}
                >
                  See a sample report
                </Link>
              </div>
              <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                {[
                  "5-dimension readiness score",
                  "Custom ROI estimate",
                  "M365 compliance gap analysis",
                  "Downloadable PDF report",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-primary/80"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Built for businesses that live in Microsoft 365
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Most small businesses run on Microsoft 365 — email, files, Teams,
                and now Copilot. The difference between a successful AI rollout and
                an expensive mistake lives in your M365 configuration: permissions,
                sensitivity labels, Purview policies, Defender coverage, Conditional
                Access. Our assessment evaluates the specific foundation AI
                actually requires. If you&apos;re running Google Workspace or a
                mix, you&apos;ll still get value — but M365 shops get the most
                specific guidance.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What we measure
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Five dimensions that determine whether Microsoft 365 Copilot and
              similar tools will return value or create new risk.
            </p>
            <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2">
              {FIVE_DOMAINS.map((d) => (
                <li key={d.title}>
                  <Card className="group h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
                    <CardHeader className="space-y-1">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-muted/60 to-background transition-colors group-hover:border-primary/20 group-hover:from-primary/5">
                        <d.icon
                          className="h-5 w-5 text-foreground/80 transition-colors group-hover:text-primary"
                          aria-hidden
                        />
                      </div>
                      <CardTitle className="text-base leading-snug sm:text-lg">
                        {d.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {d.body}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What you&apos;ll walk away with
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Three things the moment you finish — built for decision-makers, not
              IT architects only.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="h-full">
                  <CardHeader>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                      <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Built for your context
            </h2>
            <ul className="mt-8 max-w-2xl space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {TRUST.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-2 max-w-2xl divide-y divide-border">
              {FAQS.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,theme(colors.primary/10%),transparent_60%)]"
              />
              <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Ready to see where you stand?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    No credit card. Your personalized PDF is generated when you
                    finish.
                  </p>
                </div>
                <Link
                  href="/assessment"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group h-12 justify-center px-8 text-base shadow-sm shadow-primary/10 md:shrink-0",
                  )}
                >
                  Start the free assessment
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
