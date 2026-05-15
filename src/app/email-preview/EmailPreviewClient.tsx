"use client";

import { useMemo, useState } from "react";

import { EMAIL_PREVIEW_FIXTURES } from "@/lib/email/email-fixtures";

const TEMPLATES = [
  { id: "results_ready", label: "Results ready" },
  { id: "followup_24h", label: "24h follow-up" },
  { id: "followup_72h", label: "72h follow-up" },
  { id: "followup_7day", label: "7-day follow-up" },
  { id: "abandoned_recovery", label: "Abandoned recovery" },
] as const;

export function EmailPreviewClient() {
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("results_ready");
  const [fixture, setFixture] = useState<string>(EMAIL_PREVIEW_FIXTURES[1].id);

  const src = useMemo(() => {
    const u = new URL("/api/email-preview/render", window.location.origin);
    u.searchParams.set("template", template);
    u.searchParams.set("fixture", fixture);
    return u.toString();
  }, [template, fixture]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Email preview</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Iterates on React Email templates locally. Set{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_EMAIL_PREVIEW=true</code>{" "}
        in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Template</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={template}
            onChange={(e) => setTemplate(e.target.value as typeof template)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Fixture</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={fixture}
            onChange={(e) => setFixture(e.target.value)}
          >
            {EMAIL_PREVIEW_FIXTURES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mobile (~390px)
          </p>
          <iframe
            title="Email preview mobile"
            src={src}
            className="h-[720px] w-full max-w-[390px] rounded-lg border border-border bg-white shadow-sm"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Desktop (~600px)
          </p>
          <iframe
            title="Email preview desktop"
            src={src}
            className="h-[720px] w-full rounded-lg border border-border bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="mt-12">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dark client (simulated background)
        </p>
        <div className="rounded-lg bg-zinc-900 p-6">
          <iframe
            title="Email preview dark surround"
            src={src}
            className="mx-auto h-[560px] w-full max-w-[600px] rounded-md border border-zinc-700 bg-white shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
