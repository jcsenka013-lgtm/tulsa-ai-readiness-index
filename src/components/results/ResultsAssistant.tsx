"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { ProductType } from "@/types/assessment";

type Turn = { role: "user" | "assistant"; content: string };

// Mirrors MAX_TURNS / MAX_MESSAGE_CHARS in src/lib/assistant/agent.ts.
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const SUGGESTIONS = [
  "What should we fix first?",
  "Why is my lowest score so low?",
  "Are we ready for Microsoft 365 Copilot?",
  "What would working with you look like?",
];

export interface ResultsAssistantProps {
  assessmentId: string;
  productType: ProductType;
}

/** Chat panel that answers questions about this assessment's results. */
export function ResultsAssistant({ assessmentId, productType }: ResultsAssistantProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const atLimit = turns.length >= MAX_TURNS - 1;

  async function ask(question: string): Promise<void> {
    const text = question.trim().slice(0, MAX_CHARS);
    if (!text || pending || atLimit) return;

    const next: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(next);
    setDraft("");
    setError(null);
    setPending(true);
    trackEvent("results_assistant_question", {
      assessment_id: assessmentId,
      product_type: productType,
      turn: next.length,
    });

    try {
      const res = await fetch(`/api/assessment/${assessmentId}/assistant`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok || !data.reply) {
        if (res.status === 503 && data.error === "Assistant is not configured") {
          setUnavailable(true);
        }
        // Drop the unanswered question so the transcript keeps alternating.
        setTurns(turns);
        setDraft(text);
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setTurns([...next, { role: "assistant", content: data.reply }]);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      );
    } catch {
      setTurns(turns);
      setDraft(text);
      setError("Could not reach the assistant. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void ask(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(draft);
    }
  }

  if (unavailable) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5" aria-hidden />
          Ask about your results
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          An AI assistant that has read your answers and scores. It can explain a
          score, suggest what to work on first, or walk through Copilot prerequisites.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {turns.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => void ask(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        ) : (
          <ol className="space-y-3" aria-live="polite">
            {turns.map((t, i) => (
              <li
                key={i}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  t.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "border border-border bg-muted/30 text-foreground",
                )}
              >
                <span className="sr-only">{t.role === "user" ? "You: " : "Assistant: "}</span>
                {t.content}
              </li>
            ))}
            {pending ? (
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Looking at your results…
              </li>
            ) : null}
          </ol>
        )}
        <div ref={bottomRef} />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {atLimit ? (
          <p className="text-sm text-muted-foreground">
            That&apos;s the end of this conversation. Book a discovery call below to
            keep going with a person.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <label htmlFor="results-assistant-input" className="sr-only">
              Ask a question about your results
            </label>
            <Textarea
              id="results-assistant-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_CHARS}
              rows={1}
              placeholder="Ask a question about your results"
              disabled={pending}
              className="min-h-10"
            />
            <Button type="submit" size="icon-lg" disabled={pending || !draft.trim()}>
              <Send aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        )}
        <p className="text-xs text-muted-foreground">
          AI-generated answers based on your assessment. Dollar figures are estimates,
          not quotes.
        </p>
      </CardContent>
    </Card>
  );
}
