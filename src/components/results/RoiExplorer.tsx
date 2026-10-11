"use client";

import { useId, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ADMIN_HEADCOUNT_LIMITS,
  LABOR_COST_LIMITS,
  calculateRoiExplorer,
  getRoiIndustry,
  type RoiIndustryModel,
} from "@/lib/scoring/roiExplorer";

type ProcessState = { selected: boolean; hoursPerWeek: number; staff: number };

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Start with the three processes that save the most at default inputs. */
function initialProcesses(model: RoiIndustryModel): Record<string, ProcessState> {
  const ranked = [...model.processes].sort(
    (a, b) =>
      b.defaultHoursPerWeek * b.defaultStaff * b.automation.likely -
      a.defaultHoursPerWeek * a.defaultStaff * a.automation.likely,
  );
  const top = new Set(ranked.slice(0, 3).map((p) => p.id));
  return Object.fromEntries(
    model.processes.map((p) => [
      p.id,
      { selected: top.has(p.id), hoursPerWeek: p.defaultHoursPerWeek, staff: p.defaultStaff },
    ]),
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  prefix?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {prefix ? <span className="text-sm text-muted-foreground">{prefix}</span> : null}
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="h-8 w-20 tabular-nums"
        />
      </div>
    </div>
  );
}

function Explorer({ model }: { model: RoiIndustryModel }) {
  const [laborCost, setLaborCost] = useState(model.defaultLaborCostPerHour);
  const [headcount, setHeadcount] = useState(ADMIN_HEADCOUNT_LIMITS.default);
  const [processes, setProcesses] = useState(() => initialProcesses(model));

  const update = (id: string, patch: Partial<ProcessState>) =>
    setProcesses((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const result = useMemo(
    () =>
      calculateRoiExplorer({
        industry: model.id,
        adminHeadcount: headcount,
        laborCostPerHour: laborCost,
        processes: Object.entries(processes)
          .filter(([, s]) => s.selected)
          .map(([id, s]) => ({ id, hoursPerWeek: s.hoursPerWeek, staff: s.staff })),
      }),
    [model.id, headcount, laborCost, processes],
  );

  const anySelected = Object.values(processes).some((s) => s.selected);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-6">
        <NumberField
          label="Loaded labor cost per hour"
          prefix="$"
          value={laborCost}
          onChange={setLaborCost}
          min={LABOR_COST_LIMITS.min}
          max={LABOR_COST_LIMITS.max}
        />
        <NumberField
          label="Admin / back-office staff"
          value={headcount}
          onChange={setHeadcount}
          min={ADMIN_HEADCOUNT_LIMITS.min}
          max={ADMIN_HEADCOUNT_LIMITS.max}
        />
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {model.processes.map((p) => {
          const s = processes[p.id];
          return (
            <li key={p.id} className="space-y-3 p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  aria-label={p.label}
                  checked={s.selected}
                  onCheckedChange={(checked) => update(p.id, { selected: checked === true })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span>
                </span>
              </label>
              {s.selected ? (
                <div className="flex flex-wrap gap-4 pl-7">
                  <NumberField
                    label="Hours per week"
                    value={s.hoursPerWeek}
                    onChange={(n) => update(p.id, { hoursPerWeek: n })}
                    min={0}
                    max={80}
                  />
                  <NumberField
                    label="Staff involved"
                    value={s.staff}
                    onChange={(n) => update(p.id, { staff: n })}
                    min={0}
                    max={50}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {result && anySelected ? (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4" aria-live="polite">
          <div>
            <p className="text-xs text-muted-foreground">Likely annual savings</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatUsd(result.savings.likely)}
            </p>
            <p className="text-xs text-muted-foreground">
              Range {formatUsd(result.savings.conservative)} –{" "}
              {formatUsd(result.savings.optimistic)}
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">One-time build</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatUsd(result.implementationCost.min)} –{" "}
                {formatUsd(result.implementationCost.max)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Payback (likely)</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {result.paybackMonthsLikely === null
                  ? "Doesn't pay back at these inputs"
                  : `${result.paybackMonthsLikely} months`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">3-year net (likely)</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatUsd(result.threeYearNetLikely)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Includes about {formatUsd(result.annualSubscriptionCost)}/year for AI licenses and
            platform costs. Today these tasks cost about {formatUsd(result.currentAnnualCost)}
            /year in staff time; we count 85% of freed-up hours as real savings. Estimates, not
            a quote.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick at least one task to see an estimate.</p>
      )}
    </div>
  );
}

/** Interactive per-process ROI model; renders nothing for industries we don't model. */
export function RoiExplorer({ industry }: { industry: string | null | undefined }) {
  const model = getRoiIndustry(industry);
  if (!model) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Explore your savings by task</CardTitle>
        <p className="text-sm text-muted-foreground">
          Common {model.label.toLowerCase()} tasks AI can take on. Adjust the hours and staff to
          match your office.
        </p>
      </CardHeader>
      <CardContent>
        <Explorer key={model.id} model={model} />
      </CardContent>
    </Card>
  );
}
