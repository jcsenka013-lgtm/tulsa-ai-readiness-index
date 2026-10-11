"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CallBrief } from "@/lib/assistant/call-brief";

const ENGAGEMENT_LABEL: Record<CallBrief["recommended_offer"]["engagement"], string> = {
  audit: "AI readiness audit",
  pilot: "Scoped pilot",
  retainer: "Ongoing retainer",
  foundation_work: "Foundation work",
};

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function CallBriefPanel({
  assessmentId,
  initialBrief,
  initialGeneratedAt,
}: {
  assessmentId: string;
  initialBrief: CallBrief | null;
  initialGeneratedAt: string | null;
}) {
  const [brief, setBrief] = useState(initialBrief);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/admin/leads/${assessmentId}/brief`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        brief?: CallBrief;
        generated_at?: string;
        error?: string;
      };
      if (!res.ok || !body.brief) throw new Error(body.error ?? `Request failed (${res.status})`);
      setBrief(body.brief);
      setGeneratedAt(body.generated_at ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the brief.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pre-call brief</h2>
          <p className="text-xs text-muted-foreground">
            {generatedAt
              ? `Generated ${new Date(generatedAt).toLocaleString()} by Claude from this assessment`
              : "Claude reads this assessment and drafts talking points for the discovery call."}
          </p>
        </div>
        <Button onClick={generate} disabled={loading} variant={brief ? "outline" : "default"}>
          {loading ? "Writing brief…" : brief ? "Regenerate" : "Generate brief"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {brief ? (
        <div className="space-y-5">
          <p className="text-base font-medium">{brief.headline}</p>
          <p className="text-sm">{brief.situation}</p>

          <section className="rounded-md bg-muted/50 p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Lead with</h3>
            <p className="mt-1 font-medium">
              {ENGAGEMENT_LABEL[brief.recommended_offer.engagement]}
            </p>
            <p className="mt-1 text-sm">{brief.recommended_offer.why}</p>
          </section>

          {brief.top_pains.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Top pains</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {brief.top_pains.map((p) => (
                  <li key={p.title}>
                    <span className="font-medium">{p.title}.</span> {p.evidence}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <List title="Talking points" items={brief.talking_points} />
          <List title="Questions to ask" items={brief.questions_to_ask} />

          {brief.likely_objections.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Likely objections</h3>
              <dl className="mt-2 space-y-2 text-sm">
                {brief.likely_objections.map((o) => (
                  <div key={o.objection}>
                    <dt className="font-medium">“{o.objection}”</dt>
                    <dd className="text-muted-foreground">{o.response}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <List title="Watch-outs" items={brief.watch_outs} />
        </div>
      ) : null}
    </section>
  );
}
