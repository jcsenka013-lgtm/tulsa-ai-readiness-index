"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react-dom";

import { M365_GLOSSARY, splitTextWithGlossary } from "@/lib/ui/glossary";
import { cn } from "@/lib/utils";

function GlossaryTermButton({
  phrase,
  glossKey,
}: {
  phrase: string;
  glossKey: string;
}) {
  const entry = M365_GLOSSARY[glossKey];
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const bodyId = useId();

  const {
    refs,
    elements: { reference: referenceEl, floating: floatingEl },
    floatingStyles,
    update,
  } = useFloating({
    open,
    placement: "top",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const refNode = referenceEl as Element | null;
      if (refNode && !refNode.contains(t) && floatingEl && !floatingEl.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, referenceEl, floatingEl]);

  const { setReference, setFloating } = refs;

  if (!entry) {
    return <span>{phrase}</span>;
  }

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={setFloating}
            id={bodyId}
            style={floatingStyles}
            className="z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
            role="dialog"
            aria-labelledby={headingId}
          >
            <p id={headingId} className="font-medium text-foreground">
              {entry.term}
            </p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              {entry.plainEnglish}
            </p>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={setReference}
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit underline decoration-dotted underline-offset-2 ring-offset-background transition hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          setOpen((o) => !o);
          requestAnimationFrame(() => {
            void update();
          });
        }}
      >
        {phrase}
      </button>
      {popover}
    </>
  );
}

export function GlossaryText({
  className,
  text,
  as: Tag = "span",
}: {
  className?: string;
  text: string;
  as?: "span" | "p" | "div";
}) {
  const segments = splitTextWithGlossary(text);
  return (
    <Tag className={cn(className)}>
      {segments.map((s, i) =>
        s.type === "term" ? (
          <GlossaryTermButton
            key={`${s.key}-${i}`}
            phrase={s.value}
            glossKey={s.key}
          />
        ) : (
          <span key={i}>{s.value}</span>
        ),
      )}
    </Tag>
  );
}
