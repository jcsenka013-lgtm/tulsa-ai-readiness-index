import type { EmployeeCountRange, Industry } from "@/types/assessment";
import type { HoursPerWeekRepetitive } from "@/lib/questions/firmographics";

const INDUSTRY_LABEL: Record<Industry, string> = {
  dental: "Dental",
  insurance: "Insurance",
  oil_gas: "Oil & gas",
  legal: "Legal",
  professional_services: "Professional services",
  healthcare_other: "Healthcare (other)",
  other: "Other / mixed",
};

const EMPLOYEE_LABEL: Record<EmployeeCountRange, string> = {
  "1-5": "1–5 employees",
  "6-20": "6–20 employees",
  "21-50": "21–50 employees",
  "51-100": "51–100 employees",
  "100+": "100+ employees",
};

const HOURS_BUCKET_LABEL: Record<HoursPerWeekRepetitive, string> = {
  under_10: "Under 10 hours/week",
  "10_25": "10–25 hours/week",
  "25_50": "25–50 hours/week",
  "50_100": "50–100 hours/week",
  over_100: "Over 100 hours/week",
};

export function formatIndustry(i: Industry): string {
  return INDUSTRY_LABEL[i] ?? String(i);
}

export function formatEmployeeRange(
  range: EmployeeCountRange | null,
  avg: number | null,
): string {
  if (!range) return "Not provided";
  const base = EMPLOYEE_LABEL[range];
  if (avg != null) return `${base} (modeled ~${avg} FTE-equivalent)`;
  return base;
}

export function formatHoursBucket(
  key: HoursPerWeekRepetitive,
  defaulted: boolean,
): string {
  const label = HOURS_BUCKET_LABEL[key] ?? key;
  return defaulted ? `${label} (estimated default)` : label;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: abs >= 100 ? 0 : 0,
  };
  return new Intl.NumberFormat("en-US", opts).format(Math.round(n));
}

export function formatUsdRange(low: number, high: number): string {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return "—";
  if (low === high) return formatUsd(low);
  return `${formatUsd(low)} – ${formatUsd(high)}`;
}

export function formatReportDate(iso: string | null): string {
  if (!iso) return new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  }
  return d.toLocaleDateString("en-US", { dateStyle: "long" });
}

export function formatPaybackRange(low: number, high: number): string {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return "—";
  if (low === Number.POSITIVE_INFINITY || high === Number.POSITIVE_INFINITY) {
    return "Not positive in year one at these assumptions";
  }
  const a = Math.min(low, high);
  const b = Math.max(low, high);
  if (a === b) return `${a} months`;
  return `${Math.round(a * 10) / 10}–${Math.round(b * 10) / 10} months`;
}

export function truncateForPdf(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}
