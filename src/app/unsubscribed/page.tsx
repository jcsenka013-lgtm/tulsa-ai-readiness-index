import Link from "next/link";

import { SUPPORT_EMAIL } from "@/lib/email/branding";

export const dynamic = "force-dynamic";

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const q = await searchParams;
  const email = typeof q.email === "string" ? q.email : "";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        You&apos;re unsubscribed
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        You&apos;ve been unsubscribed from Tulsa Applied AI Readiness Assessment
        emails
        {email ? (
          <>
            {" "}
            for <span className="font-medium text-foreground">{email}</span>
          </>
        ) : null}
        . If this was a mistake, email{" "}
        <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <p className="mt-8">
        <Link href="/" className="text-sm font-medium text-primary underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
