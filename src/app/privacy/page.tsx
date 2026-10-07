import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Tulsa AI Readiness Index handles personal and assessment data.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
            Requires attorney review before public launch
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Privacy policy (draft)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {/* FLAG_FOR_ATTORNEY_REVIEW: entire page — data practices, DPA, breach process, and jurisdictional terms must be tuned to actual processing + Oklahoma/US law. */}

          <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <h2 className="text-lg font-semibold text-foreground">Who we are</h2>
            <p>
              The Tulsa AI Readiness Index and related services are provided by
              Tulsa Applied AI LLC, based in Tulsa, Oklahoma (&ldquo;we,&rdquo; &ldquo;us&rdquo;). This
              page describes what we collect when you use the public assessment
              and how we use it. It is a working draft:{" "}
              <strong className="text-foreground">do not rely on it as final legal notice until counsel signs off.</strong>
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">What we collect</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong className="text-foreground">Assessment responses</strong> — your answers
                to readiness questions, including free-text and structured
                choices (for example, Microsoft 365 configuration and process
                maturity items).
              </li>
              <li>
                <strong className="text-foreground">Firmographic information</strong> — industry, employee
                count, revenue band, and similar fields used to contextualize
                your score and ROI model.
              </li>
              <li>
                <strong className="text-foreground">Contact information</strong> — name, email, phone,
                and company you provide at the contact gate, when applicable.
              </li>
              <li>
                <strong className="text-foreground">Technical data</strong> — basic request metadata
                (for example, IP and user agent) as typically logged by our
                hosting and email providers, used for security and deliverability
                (retention to be set by final policy).
              </li>
            </ul>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Why we use it</h2>
            <p>
              We process this information to: generate and deliver your results
              and PDF report; send transactional email (e.g. results link,
              optional follow-up sequence you can unsubscribe from); run internal
              operations (e.g. notifications to our team in Slack, stored in
              the United States where supported); and improve the product. We
              <strong className="text-foreground"> do not</strong> sell your personal
              information as a standalone commercial product. Marketing use should
              be limited to the purposes described in your final terms.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">
              Service providers (sub-processors, United States–hosted where stated)
            </h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Supabase (database) — data stored in US region per project settings.</li>
              <li>Resend (transactional email).</li>
              <li>Calendly (scheduling, when you book through our offering).</li>
              <li>Cloudflare (web hosting, Workers, DNS, logs as configured).</li>
              <li>Slack (internal operational notifications, not a customer database).</li>
            </ul>
            <p>
              Final privacy disclosure must name each sub-processor, link to
              their DPAs, and document transfer mechanisms as needed.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Retention</h2>
            <p>
              Retention windows for completed assessments, partial sessions, and
              logs are not finalized here. Counsel should set explicit retention
              and deletion rules aligned with the minimum necessary for
              services, accounting, and legal hold needs.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Your rights</h2>
            <p>
              Depending on applicable law, you may have rights to access, delete,
              correct, or port your data, and to object to certain processing.
              The mechanism for requests is not final in this draft.
            </p>
            <p>
              <strong className="text-foreground">Privacy requests (draft):</strong>{" "}
              <a className="text-foreground underline" href="mailto:privacy@tulsaappliedai.com">
                privacy@tulsaappliedai.com
              </a>{" "}
              — update to a monitored inbox and add verification + SLA in the
              final version.
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Children</h2>
            <p>
              The assessment is not directed to children. Do not use it if you
              are under 16 (or the age required in your jurisdiction).
            </p>

            <h2 className="mt-6 text-lg font-semibold text-foreground">Changes</h2>
            <p>We will post an updated version when this policy changes.</p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
