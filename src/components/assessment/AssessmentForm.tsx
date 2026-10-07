"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2Icon } from "lucide-react";

import { trackFunnel, FUNNEL } from "@/lib/analytics-funnel";
import { DOMAINS } from "@/lib/questions/bank";
import { TARI_FLOW_STEP_KEY } from "@/lib/assessment/flow-constants";
import { isLikelyPersonalEmailDomain } from "@/lib/assessment/personal-email";
import { getDomainSlicesForProduct } from "@/lib/questions/copilotQuestionSet";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { BankQuestion } from "@/lib/questions/types";
import type {
  AnnualRevenueRange,
  HoursPerWeekRepetitive,
} from "@/lib/questions/firmographics";
import type { EmployeeCountRange, Industry, ProductType } from "@/types/assessment";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FirmographicsStep } from "./FirmographicsStep";
import { ContactGate } from "./ContactGate";
import { QuestionCard } from "./QuestionCard";
import { GlossaryText } from "./GlossaryText";

type ContactState = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  priority6m: string;
  consent: boolean;
  personalEmailAck: boolean;
};

type State = {
  step: number;
  responses: Record<string, string | string[]>;
  industry: Industry | null;
  employeeCountRange: EmployeeCountRange | null;
  annualRevenueRange: AnnualRevenueRange | null;
  hoursPerWeekRepetitive: HoursPerWeekRepetitive | null;
  roleTitle: string | null;
  contact: ContactState;
};

type FirmographicUpdate = {
  industry?: Industry | null;
  employeeCountRange?: EmployeeCountRange | null;
  annualRevenueRange?: AnnualRevenueRange | null;
  hoursPerWeekRepetitive?: HoursPerWeekRepetitive | null;
  roleTitle?: string | null;
};

type Action =
  | { type: "SET_FIRMOGRAPHIC"; payload: FirmographicUpdate }
  | { type: "SET_RESPONSE"; questionId: string; value: string | string[] }
  | { type: "SET_CONTACT"; payload: Partial<ContactState> }
  | { type: "SET_STEP"; step: number }
  | { type: "LOAD_EXISTING"; payload: State };

function isAnswered(
  q: BankQuestion,
  raw: string | string[] | undefined,
): boolean {
  if (raw === undefined) return false;
  if (q.question_type === "single_select") {
    return typeof raw === "string" && raw.length > 0;
  }
  return Array.isArray(raw) && raw.length > 0;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIRMOGRAPHIC": {
      const p = action.payload;
      return {
        ...state,
        ...(p.industry !== undefined && { industry: p.industry }),
        ...(p.employeeCountRange !== undefined && {
          employeeCountRange: p.employeeCountRange,
        }),
        ...(p.annualRevenueRange !== undefined && {
          annualRevenueRange: p.annualRevenueRange,
        }),
        ...(p.hoursPerWeekRepetitive !== undefined && {
          hoursPerWeekRepetitive: p.hoursPerWeekRepetitive,
        }),
        ...(p.roleTitle !== undefined && { roleTitle: p.roleTitle }),
      };
    }
    case "SET_RESPONSE":
      return {
        ...state,
        responses: { ...state.responses, [action.questionId]: action.value },
      };
    case "SET_CONTACT":
      return {
        ...state,
        contact: { ...state.contact, ...action.payload },
      };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "LOAD_EXISTING":
      return action.payload;
    default:
      return state;
  }
}

function isFirmographicReady(s: State): boolean {
  return (
    s.industry != null &&
    s.employeeCountRange != null &&
    s.hoursPerWeekRepetitive != null
  );
}

function isDomainStepComplete(
  step: number,
  s: State,
  domainSlices: ReturnType<typeof getDomainSlicesForProduct>,
): { ok: true } | { ok: false; message: string } {
  const di = step - 3;
  const slice = domainSlices[di];
  if (!slice) return { ok: true };
  for (const q of slice.questions) {
    if (!isAnswered(q, s.responses[q.id])) {
      return {
        ok: false,
        message: "Please answer every question in this section to continue.",
      };
    }
  }
  return { ok: true };
}

export type ApiAssessmentRow = {
  id: string;
  status: string;
  industry: string | null;
  employee_count_range: string | null;
  annual_revenue_range: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  role_title: string | null;
  product_type?: string | null;
  responses: Record<string, unknown> | null;
};

function productTypeFromRowOrProp(
  row: ApiAssessmentRow,
  prop: ProductType,
): ProductType {
  if (row.product_type === "copilot_readiness" || row.product_type === "ai_readiness") {
    return row.product_type;
  }
  return prop;
}

function stateFromRow(row: ApiAssessmentRow, productType: ProductType): State {
  const totalSteps = 2 + getDomainSlicesForProduct(productType).length + 1;
  const raw = { ...(row.responses ?? {}) } as Record<string, unknown>;
  const stepRaw = raw[TARI_FLOW_STEP_KEY];
  const step = Math.min(
    totalSteps,
    Math.max(1, typeof stepRaw === "number" ? stepRaw : Number(stepRaw) || 1),
  );
  const priority6m =
    typeof raw.priority_next_6_months === "string"
      ? raw.priority_next_6_months
      : "";
  const hours = raw.hours_per_week_repetitive as
    | HoursPerWeekRepetitive
    | undefined;
  const rest: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === TARI_FLOW_STEP_KEY) continue;
    if (k === "hours_per_week_repetitive") continue;
    if (k === "priority_next_6_months") continue;
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      rest[k] = v as string[];
    } else if (typeof v === "string") {
      rest[k] = v;
    }
  }
  return {
    step,
    responses: rest,
    industry: (row.industry as Industry) ?? null,
    employeeCountRange: (row.employee_count_range as EmployeeCountRange) ?? null,
    annualRevenueRange: (row.annual_revenue_range as AnnualRevenueRange) ?? null,
    hoursPerWeekRepetitive: hours ?? null,
    roleTitle: row.role_title,
    contact: {
      fullName: row.full_name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      companyName: row.company_name ?? "",
      priority6m,
      consent: false,
      personalEmailAck: false,
    },
  };
}

function buildPatchBody(s: State): Record<string, unknown> {
  const responses: Record<string, unknown> = { ...s.responses };
  if (s.hoursPerWeekRepetitive) {
    responses.hours_per_week_repetitive = s.hoursPerWeekRepetitive;
  }
  responses[TARI_FLOW_STEP_KEY] = s.step;
  if (s.contact.priority6m.trim()) {
    responses.priority_next_6_months = s.contact.priority6m.trim();
  }

  const body: Record<string, unknown> = { responses };
  if (s.industry) body.industry = s.industry;
  if (s.employeeCountRange) body.employee_count_range = s.employeeCountRange;
  if (s.annualRevenueRange) {
    body.annual_revenue_range = s.annualRevenueRange;
  }
  if (s.roleTitle) body.role_title = s.roleTitle;
  if (s.contact.fullName.trim()) body.full_name = s.contact.fullName.trim();
  if (s.contact.email.trim()) body.email = s.contact.email.trim();
  if (s.contact.phone.trim()) body.phone = s.contact.phone.trim();
  if (s.contact.companyName.trim()) {
    body.company_name = s.contact.companyName.trim();
  }
  return body;
}

function canSubmitContact(s: State): boolean {
  const c = s.contact;
  if (!c.fullName.trim() || !c.email.trim() || !c.companyName.trim()) {
    return false;
  }
  if (!c.consent) return false;
  if (isLikelyPersonalEmailDomain(c.email) && !c.personalEmailAck) {
    return false;
  }
  return true;
}

export function AssessmentForm({
  assessmentId,
  initialRow,
  productType: productTypeProp,
}: {
  assessmentId: string;
  initialRow: ApiAssessmentRow;
  productType: ProductType;
}) {
  const productType = productTypeFromRowOrProp(initialRow, productTypeProp);

  const domainSlices = useMemo(
    () => getDomainSlicesForProduct(productType),
    [productType],
  );
  const totalSteps = 2 + domainSlices.length + 1;
  const lastDomainStep = 2 + domainSlices.length;

  const router = useRouter();
  const [state, dispatch] = useReducer(
    reducer,
    { initial: initialRow, productType } as {
      initial: ApiAssessmentRow;
      productType: ProductType;
    },
    (init) => stateFromRow(init.initial, init.productType),
  );
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const [consecutiveSaveFailures, setConsecutiveSaveFailures] = useState(0);
  const hasUserEdited = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const [completing, setCompleting] = useState(false);

  const savePatch = useCallback(
    async (s: State) => {
      setSaveStatus("saving");
      const res = await fetch(`/api/assessment/${assessmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPatchBody(s)),
      });
      if (!res.ok) {
        setSaveStatus("error");
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setConsecutiveSaveFailures((c) => c + 1);
        toast.error(j.error ?? "Could not save your progress.");
        return false;
      }
      setSaveStatus("idle");
      setConsecutiveSaveFailures(0);
      return true;
    },
    [assessmentId],
  );

  // Debounced autosave after the user makes changes (not on initial load).
  useEffect(() => {
    if (!hasUserEdited.current) return;
    const t = setTimeout(() => {
      void savePatch(stateRef.current);
    }, 500);
    return () => clearTimeout(t);
  }, [state, savePatch]);

  const announceRef = useRef<HTMLDivElement>(null);
  const liveMessage = `Step ${state.step} of ${totalSteps}. ${
    saveStatus === "saving"
      ? "Saving."
      : saveStatus === "error"
        ? "Save error."
        : "All changes saved."
  }`;

  useEffect(() => {
    if (announceRef.current) {
      announceRef.current.textContent = liveMessage;
    }
  }, [liveMessage]);

  // Focus first interactive on step change
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const focusable = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    requestAnimationFrame(() => focusable?.focus());
  }, [state.step]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!hasUserEdited.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const goNext = async () => {
    const s = stateRef.current;
    if (s.step === 1) {
      hasUserEdited.current = true;
      dispatch({ type: "SET_STEP", step: 2 });
      await savePatch({ ...s, step: 2 });
      return;
    }
    if (s.step === 2) {
      if (!isFirmographicReady(s)) {
        toast.error("Select your industry, team size, and hours spent on repetitive work.");
        return;
      }
      hasUserEdited.current = true;
      dispatch({ type: "SET_STEP", step: 3 });
      await savePatch({ ...s, step: 3 });
      return;
    }
    if (s.step >= 3 && s.step <= lastDomainStep) {
      const d = isDomainStepComplete(s.step, s, domainSlices);
      if (!d.ok) {
        toast.error(d.message);
        return;
      }
      hasUserEdited.current = true;
      const next = s.step + 1;
      dispatch({ type: "SET_STEP", step: next });
      await savePatch({ ...s, step: next });
      return;
    }
  };

  const goBack = async () => {
    const s = stateRef.current;
    if (s.step <= 1) return;
    hasUserEdited.current = true;
    const next = s.step - 1;
    const ok = await savePatch({ ...s, step: next });
    if (ok) dispatch({ type: "SET_STEP", step: next });
  };

  const onComplete = async () => {
    if (!canSubmitContact(state)) {
      toast.error("Fill in name, work email, company, consent, and personal-email acknowledgment if needed.");
      return;
    }
    setCompleting(true);
    const ok = await savePatch(state);
    if (!ok) {
      setCompleting(false);
      return;
    }
    const res = await fetch(`/api/assessment/${assessmentId}/complete`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Could not complete the assessment.");
      setCompleting(false);
      return;
    }
    const payload = (await res.json()) as { product_type?: string };
    const resultProduct =
      payload.product_type === "copilot_readiness" || payload.product_type === "ai_readiness"
        ? payload.product_type
        : productType;
    trackFunnel(FUNNEL.assessmentCompleted, resultProduct, { assessment_id: assessmentId });
    router.replace(PRODUCTS[resultProduct].resultsPath(assessmentId));
  };

  const progress = Math.min(100, (state.step / totalSteps) * 100);

  return (
    <div>
      {consecutiveSaveFailures >= 3 ? (
        <div
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-950 dark:text-amber-100"
          role="alert"
        >
          We&apos;re having trouble saving. Your progress may be lost if you
          leave. Check your connection and try again.
        </div>
      ) : null}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 py-3 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4">
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            Step {state.step} of {totalSteps}
          </span>
          <Progress
            className="min-w-0 max-w-48 flex-1"
            value={progress}
            aria-label={`Step ${state.step} of ${totalSteps}`}
          >
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        </div>
        <div
          ref={announceRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>

      <div
        className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8"
        ref={mainRef}
      >
        {state.step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                How AI-ready is your business?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-base leading-relaxed text-muted-foreground">
              <p className="text-foreground">
                This free assessment takes about {PRODUCTS[productType].estimatedMinutes}{" "}
                minutes. You&apos;ll get your readiness score, a personalized
                ROI estimate, and a roadmap you can share with your team.
              </p>
              <div>
                <p className="mb-2 font-medium text-foreground">
                  What you&apos;ll see in your report:
                </p>
                <ul className="list-inside list-disc space-y-1.5 pl-0">
                  {DOMAINS.map((d) => (
                    <li key={d.id} className="pl-0">
                      <GlossaryText text={d.name} as="span" />
                    </li>
                  ))}
                </ul>
              </div>
              <p>
                <GlossaryText
                  as="span"
                  text="We use Microsoft 365 language throughout because that's where most small business AI risks and opportunities live today."
                />
              </p>
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  void goNext();
                }}
              >
                Let&apos;s begin
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {state.step === 2 ? (
          <FirmographicsStep
            value={{
              industry: state.industry,
              employeeCountRange: state.employeeCountRange,
              annualRevenueRange: state.annualRevenueRange,
              hoursPerWeekRepetitive: state.hoursPerWeekRepetitive,
              roleTitle: state.roleTitle,
            }}
            onChange={(p) => {
              hasUserEdited.current = true;
              dispatch({ type: "SET_FIRMOGRAPHIC", payload: p });
            }}
          />
        ) : null}

        {state.step >= 3 && state.step <= lastDomainStep
          ? (() => {
              const di = state.step - 3;
              const slice = domainSlices[di];
              if (!slice) return null;
              return (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {slice.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <GlossaryText text={slice.description} as="span" />
                    </p>
                  </div>
                  <div className="space-y-6">
                    {slice.questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        value={state.responses[q.id] as
                          | string
                          | string[]
                          | undefined}
                        onChange={(v) => {
                          hasUserEdited.current = true;
                          dispatch({
                            type: "SET_RESPONSE",
                            questionId: q.id,
                            value: v,
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          : null}

        {state.step === totalSteps ? (
          <div className="space-y-6">
            <ContactGate
              value={state.contact}
              onChange={(p) => {
                hasUserEdited.current = true;
                dispatch({ type: "SET_CONTACT", payload: p });
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                size="lg"
                className="w-full sm:ml-auto sm:w-auto"
                disabled={completing}
                onClick={onComplete}
              >
                {completing ? (
                  <>
                    <Loader2Icon
                      className="mr-2 size-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    Calculating...
                  </>
                ) : (
                  "Get My Results"
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {state.step > 1 && state.step < totalSteps ? (
          <div
            className="flex items-center justify-between border-t border-border pt-4"
          >
            {state.step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void goBack();
                }}
                className="gap-2"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                void goNext();
              }}
            >
              Next
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}

        {state.step === 1 ? null : state.step < totalSteps ? null : (
          <div className="flex justify-start border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void goBack();
              }}
              className="gap-2"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
