import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the Tulsa AI Readiness Index assessment (draft).",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
            Requires attorney review before public launch
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Terms of use (draft)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {/* FLAG_FOR_ATTORNEY_REVIEW: entire page — especially disclaimers, warranty exclusion, liability cap cross-reference to MSA, and dispute resolution. */}

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <h2 className="text-lg font-semibold text-foreground">Agreement</h2>
            <p>
              These draft terms govern use of the Tulsa AI Readiness Index
              public assessment and related online materials. By using the
              service, you agree to these terms (or you must not use the
              service). <strong className="text-foreground">This is not a substitute for
              professional legal, financial, or compliance advice.</strong>
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Informational, not professional advice</h2>
            <p>
              The assessment, scores, ROI estimates, PDF reports, and on-screen
              insights are for general informational and educational purposes
              only. They are not a substitute for a formal engagement, audit, or
              professional advice in law, medicine, security, or accounting. You
              remain solely responsible for decisions you make after using the
              tool.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Assumptions and limitations</h2>
            <p>
              Scores and projections rely on your answers, industry defaults,
              and model assumptions. Actual results will vary. We do not
              guarantee any particular business outcome, cost saving, or
              regulatory outcome. Where we reference Microsoft 365, Copilot, or
              compliance frameworks, those are illustrative — your obligations
              depend on your contracts, regulators, and facts on the ground.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Acceptable use</h2>
            <p>
              You will not use the service to violate the law, probe or disrupt
              our systems, or attempt to exfiltrate other users&rsquo; data. We may
              suspend or refuse access in cases of abuse.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Disclaimer of warranties</h2>
            <p>
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis, without warranties of any kind, whether express
              or implied, to the maximum extent permitted by law.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Tulsa Applied AI LLC and
              its people will not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or for any loss of
              profits, data, or goodwill, arising from or related to your use of
              the assessment. Our aggregate liability for any claim should be
              aligned with counsel with your MSA/engagement terms for paid
              work; this draft is intentionally conservative for the free
              public tool and may not match your form client agreement.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Governing law and venue (draft — align to MSA)</h2>
            <p>
              Counsel should set governing law, venue, and dispute resolution
              consistently with your master services agreement. A typical starting
              point for Oklahoma-based work is the State of Oklahoma, but
              that must be confirmed.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Contact</h2>
            <p>
              <a className="text-foreground underline" href="mailto:info@tulsaappliedai.com">
                info@tulsaappliedai.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
