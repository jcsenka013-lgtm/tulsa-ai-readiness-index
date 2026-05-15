"use client";

import { useState } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlossaryText } from "@/components/assessment/GlossaryText";
import { cn } from "@/lib/utils";
import type { BankQuestion } from "@/lib/questions/types";

function isOptionSelected(
  q: BankQuestion,
  value: string | string[] | undefined,
  label: string,
): boolean {
  if (q.question_type === "single_select") {
    return value === label;
  }
  return Array.isArray(value) && value.includes(label);
}

export function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: BankQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  const onToggleOption = (label: string, checked: boolean) => {
    const prev = Array.isArray(value) ? value : [];
    if (checked) {
      onChange([...new Set([...prev, label])]);
    } else {
      onChange(prev.filter((x) => x !== label));
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base leading-snug">
          <GlossaryText text={question.text} as="span" />
        </CardTitle>
        {question.help_text ? (
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto min-h-0 px-0 text-muted-foreground"
              onClick={() => setHelpOpen((o) => !o)}
              aria-expanded={helpOpen}
            >
              What does this mean?
            </Button>
            {helpOpen && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <GlossaryText text={question.help_text} as="span" />
              </p>
            )}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {question.question_type === "single_select" ? (
          <RadioGroup
            className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2"
            value={typeof value === "string" && value.length > 0 ? value : null}
            onValueChange={(v) => onChange(typeof v === "string" ? v : "")}
            name={question.id}
          >
            {question.options.map((opt, i) => {
              const selected = isOptionSelected(question, value, opt.label);
              return (
                <label
                  key={opt.label}
                  className={cn(
                    "group/option flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all hover:bg-muted/50",
                    selected
                      ? "border-primary/40 bg-primary/[0.04] ring-2 ring-primary shadow-sm"
                      : "border-border hover:border-foreground/15",
                  )}
                >
                  <RadioGroupItem
                    value={opt.label}
                    id={`${question.id}-opt-${i}`}
                    className="mt-0.5"
                  />
                  <span className="flex-1 text-sm leading-relaxed">
                    <GlossaryText text={opt.label} as="span" />
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        ) : (
          <fieldset
            className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2"
            aria-label={question.text}
          >
            <legend className="sr-only">Select all that apply</legend>
            {question.options.map((opt) => {
              const arr = Array.isArray(value) ? value : [];
              const selected = arr.includes(opt.label);
              return (
                <label
                  key={opt.label}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all hover:bg-muted/50",
                    selected
                      ? "border-primary/40 bg-primary/[0.04] ring-2 ring-primary shadow-sm"
                      : "border-border hover:border-foreground/15",
                  )}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected}
                    onCheckedChange={(checked) =>
                      onToggleOption(opt.label, Boolean(checked))
                    }
                    value={opt.label}
                    name={`${question.id}[]`}
                  />
                  <span className="flex-1 text-sm leading-relaxed">
                    <GlossaryText text={opt.label} as="span" />
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
      </CardContent>
    </Card>
  );
}
