"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ANNUAL_REVENUE_QUESTION,
  EMPLOYEE_COUNT_QUESTION,
  HOURS_PER_WEEK_QUESTION,
  INDUSTRY_QUESTION,
  ROLE_TITLE_OPTIONS,
  type AnnualRevenueRange,
  type HoursPerWeekRepetitive,
} from "@/lib/questions/firmographics";
import type { EmployeeCountRange, Industry } from "@/types/assessment";
import { GlossaryText } from "@/components/assessment/GlossaryText";

export interface FirmographicsFormValue {
  industry: Industry | null;
  employeeCountRange: EmployeeCountRange | null;
  annualRevenueRange: AnnualRevenueRange | null;
  hoursPerWeekRepetitive: HoursPerWeekRepetitive | null;
  roleTitle: string | null;
}

export function FirmographicsStep({
  value,
  onChange,
  idPrefix = "firm",
}: {
  value: FirmographicsFormValue;
  onChange: (v: Partial<FirmographicsFormValue>) => void;
  idPrefix?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About your business</CardTitle>
        <p className="text-sm text-muted-foreground">
          This context calibrates your ROI estimate to your industry, team
          size, and how much of the week is still spent on manual work.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <section
          className="space-y-2"
          aria-labelledby={`${idPrefix}-industry-heading`}
        >
          <h3
            className="text-sm font-medium"
            id={`${idPrefix}-industry-heading`}
          >
            {INDUSTRY_QUESTION.prompt}
          </h3>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={INDUSTRY_QUESTION.prompt}
          >
            {INDUSTRY_QUESTION.options.map((opt) => {
              const active = value.industry === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ industry: opt.value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/15 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="space-y-2"
          aria-labelledby={`${idPrefix}-emp-heading`}
        >
          <h3
            className="text-sm font-medium"
            id={`${idPrefix}-emp-heading`}
          >
            {EMPLOYEE_COUNT_QUESTION.prompt}
          </h3>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={EMPLOYEE_COUNT_QUESTION.prompt}
          >
            {EMPLOYEE_COUNT_QUESTION.options.map((opt) => {
              const active = value.employeeCountRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({ employeeCountRange: opt.value })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/15 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-revenue`} className="text-sm font-medium">
            {ANNUAL_REVENUE_QUESTION.prompt}
          </Label>
          <Select
            value={value.annualRevenueRange ?? null}
            onValueChange={(v) =>
              onChange({
                annualRevenueRange:
                  typeof v === "string" && v.length > 0
                    ? (v as AnnualRevenueRange)
                    : null,
              })
            }
          >
            <SelectTrigger
              id={`${idPrefix}-revenue`}
              className="w-full max-w-md"
            >
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              {ANNUAL_REVENUE_QUESTION.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section
          className="space-y-2"
          aria-labelledby={`${idPrefix}-hours-heading`}
        >
          <h3
            className="text-sm font-medium"
            id={`${idPrefix}-hours-heading`}
          >
            {HOURS_PER_WEEK_QUESTION.prompt}
          </h3>
          {HOURS_PER_WEEK_QUESTION.helpText ? (
            <p className="text-xs text-muted-foreground">
              {HOURS_PER_WEEK_QUESTION.helpText}
            </p>
          ) : null}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={HOURS_PER_WEEK_QUESTION.prompt}
          >
            {HOURS_PER_WEEK_QUESTION.options.map((opt) => {
              const active = value.hoursPerWeekRepetitive === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange({ hoursPerWeekRepetitive: opt.value })
                  }
                  className={cn(
                    "max-w-full rounded-full border px-3 py-1.5 text-left text-sm leading-snug transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/15 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-role`} className="text-sm font-medium">
            Your role
          </Label>
          <p className="text-xs text-muted-foreground">
            Helps us connect results to the right person if we follow up.
          </p>
          <Select
            value={value.roleTitle ?? null}
            onValueChange={(v) =>
              onChange({
                roleTitle:
                  typeof v === "string" && v.length > 0 ? v : null,
              })
            }
          >
            <SelectTrigger
              id={`${idPrefix}-role`}
              className="w-full max-w-md"
            >
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TITLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          <GlossaryText
            as="span"
            text="We use Microsoft 365, Entra ID, and Copilot terminology in the next sections because that is where most small-business AI risk and upside show up first."
          />
        </p>
      </CardContent>
    </Card>
  );
}
