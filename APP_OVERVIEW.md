# Tulsa AI Readiness Index — Application Overview

This document summarizes what exists in the **Tulsa AI Readiness Index** web app for **Tulsa Applied AI LLC** as of the current codebase. It is a lead-generation and diagnostic product: visitors take an assessment, receive scores and narrative insights, and (when the full flow is wired) persist results and receive a roadmap.

---

## Product intent

- **Audience:** Small-to-mid businesses in Oklahoma and the surrounding region (dental, insurance, oil & gas field services, legal, professional services).
- **Promise (per marketing copy):** A five-minute assessment yielding:
  - A **readiness score** across five domains
  - A **custom ROI estimate**
  - A **personalized roadmap** (PDF planned)
- **Business outcome:** Qualified leads with structured responses suitable for follow-up sales (audit, pilot, retainer, foundation work).

---

## Technology stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **TypeScript** |
| Styling | **Tailwind CSS v4**, **shadcn/ui**-style primitives (`components.json`) |
| Fonts | **Geist** / **Geist Mono** (Google Fonts via `next/font`) |
| Data | **Supabase** (Postgres, planned auth) — `@supabase/ssr`, `@supabase/supabase-js` |
| Testing | **Vitest** |
| Hosting | **Cloudflare Workers** via vinext, live at tulsaappliedai.com (see `README.md`) |

**Scripts:** `npm run dev`, `build`, `start`, `lint`, `test`, `test:watch`.

---

## What is implemented vs. not yet built

### Implemented

- **Landing page** (`src/app/page.tsx`): Hero, value props, CTAs to `/assessment`, footer. Branded as “Tulsa AI Readiness Index.”
- **Root layout & global styles** (`src/app/layout.tsx`, `src/app/globals.css`): Metadata, typography, base layout shell.
- **Question bank (data-driven):** `src/lib/questions/questions.json` — five domains, weighted scoring, free vs paid tiers, Microsoft 365–focused security/compliance copy with `help_text` for non-technical owners.
- **Firmographic intake (code-defined):** `src/lib/questions/firmographics.ts` — industry, employee count, annual revenue, hours/week of repetitive work (feeds ROI logic; some fields map to DB columns).
- **ROI JSON model (detailed):** `src/lib/questions/roi-calculator.json` — industry-specific process lists, automation bands, implementation cost ranges (intended for a richer calculator UI; see **Two ROI paths** below).
- **Scoring engine:** `src/lib/scoring/` — domain scores 0–100, overall weighted score, readiness tier, recommended next step, bundled **assessment result** API.
- **ROI engine (simplified):** `src/lib/scoring/calculateROI.ts` — labor-cost band, automation %, investment band by tier, payback and first-year savings ranges (uses firmographic keys in `responses`).
- **Insight generator:** `src/lib/scoring/generateInsights.ts` — rule-based consultant-style insights (critical / warning / opportunity / strength) tied to specific question IDs.
- **Microsoft 365 gap analysis module:** `src/lib/m365-gap-analysis.ts` — large, standalone engine for Copilot readiness, compliance gaps, upgrades, and narrative sections (consumes assessment-shaped responses + optional M365 keys; suitable for PDF/report sections).
- **Domain types:** `src/types/assessment.ts` — enums, `AssessmentResponse`, `ScoreBreakdown`, `Assessment`, `Lead`, etc., aligned with migrations after `002_align_scoring_domains.sql`.
- **Supabase clients:** `src/lib/supabase/client.ts` (browser), `server.ts` (server + **service role** helper for bypassing RLS).
- **Database migrations:** `supabase/migrations/001_initial_schema.sql`, `002_align_scoring_domains.sql` — `assessments` and `leads` tables, RLS, score columns renamed to match the five current domains.
- **UI primitives:** shadcn-style components under `src/components/ui/` (button, card, checkbox, dialog, input, label, progress, radio-group, select, sonner, textarea).
- **Tests:** `src/lib/scoring/__tests__/` — scoring fixtures and tests for dimension scores, overall score, tier, recommended next step, etc. `src/lib/m365-gap-analysis.test.ts` exercises the M365 module.
- **Config:** `vitest.config.ts`, `next.config.ts`, `tsconfig.json`, `.env.local.example`.

- **End-to-end flow:** multi-step assessment with autosave (`src/app/assessment/`, `src/components/assessment/`), results pages (`/results/[id]`, `/copilot/results/[id]`), and route handlers under `src/app/api/` for create / update / complete / booked / PDF / unsubscribe / cron.
- **PDF + email:** `src/lib/pdf/` (React-PDF report uploaded to the private `reports` bucket) and `src/lib/email/` (Resend templates and the hourly follow-up sequence).
- **Admin:** `/admin` and `/admin/leads`, protected by Basic Auth in `src/proxy.ts`.

### Not built in-repo

- **Engagement signed** funnel event (fired from a CRM, see `docs/LAUNCH-CHECKLIST.md`).
- Distributed rate limiting — the current limiter is in-memory per instance.

**Environment:** Local dev expects `.env.local` from `.env.local.example` (Supabase URL/keys, `NEXT_PUBLIC_SITE_URL`).

---

## Five scoring domains (authoritative)

Defined in `src/lib/questions/questions.json` with weights that sum to **100**:

| Domain ID | Name | Weight |
| --- | --- | ---: |
| `data_security_compliance` | Data Security & Compliance Posture | 25 |
| `operational_process_maturity` | Operational Process Maturity | 25 |
| `technology_infrastructure` | Technology Infrastructure Readiness | 20 |
| `team_change_management` | Team & Change Management | 15 |
| `financial_strategic_alignment` | Financial & Strategic Alignment | 15 |

**Question counts:** 48 scored questions total; **10** are tagged `tier: "free"` (two per domain) for a short assessment; the rest are `tier: "paid"` for a full audit.

**Question types in JSON:** `single_select` and `multi_select` only. Types in `src/lib/questions/types.ts` match that subset (slider/number/boolean are not in the current bank).

---

## How scoring works

Implemented in `src/lib/scoring/calculateScores.ts`:

1. **Per question:** Answers are stored as **option labels** (strings) or arrays of labels for multi-selects.
2. **Multi-select score:** **Maximum** `score_value` among selected options (strongest signal wins).
3. **Unanswered questions:** Omitted from **both** numerator and denominator (supports partial / tiered assessments without penalty).
4. **Domain score (0–100):**  
   `Σ(question_score × weight) / Σ(max_option_score × weight) × 100` per domain.
5. **Overall score:** Weighted average of the five domain scores using each domain’s `weight` from JSON.
6. **Readiness tier:** From `readiness_tier_thresholds` in JSON (`foundation` / `exploration` / `pilot` / `scale`).
7. **Recommended next step:** `audit` | `pilot` | `retainer` | `foundation_work` from tier, with a **compliance override**: if regulated data is indicated and data-security score is low, force `foundation_work`.

**Single entry point for apps:** `calculateAssessmentResult(responses)` in `src/lib/scoring/index.ts` returns scores, tier, recommended next step, ROI estimate, and insights.

---

## Two ROI paths (important distinction)

| Path | Location | Role |
| --- | --- | --- |
| **Runtime calculator** | `src/lib/scoring/calculateROI.ts` | Uses `industry`, `employee_count_range`, `annual_revenue_range`, `hours_per_week_repetitive` from responses; fixed loaded hourly table by industry; 40–65% automation band on a derived annual labor cost; investment ranges by readiness tier; payback and first-year net savings bands. |
| **Structured model** | `src/lib/questions/roi-calculator.json` | Richer, **per-process** model: hours/week, staff count, `{min, likely, max}` automation %, implementation cost min/max per process, industry process lists (dental, insurance, legal, oil & gas). Intended for a dedicated ROI module or future alignment with `calculateROI.ts`. |

The database columns `estimated_annual_savings` and `estimated_payback_months` are the natural place to persist a **single** summary once you decide which formula is canonical for production.

---

## Insights

`src/lib/scoring/generateInsights.ts` applies a **prioritized, deduplicated rule set** (e.g. compliance gap before AI, shadow AI + regulated data, MFA gaps, leadership blocked AI, tool sprawl, strengths by high domain scores). Rules reference concrete question IDs from `questions.json`. Output is capped (max 8 insights) with at least one **strength** (including a universal fallback).

---

## Microsoft 365 gap analysis

`src/lib/m365-gap-analysis.ts` is a **separate, large analytical engine** (not the same as the 0–100 domain scorer). It:

- Evaluates **Copilot readiness** and prerequisite tables.
- Surfaces **compliance gaps** with remediation paths (admin center hints, effort, licensing).
- Produces **recommended upgrades**, quick wins, and narrative sections for reports.

It documents optional response keys (e.g. `m365_license_tier`, `m365_dlp`) that can complement the main question bank when you wire a detailed M365 inventory step or import from tooling.

---

## Database schema (Supabase)

**`assessments`**

- Identity & lifecycle: `id`, `created_at`, `completed_at`, `status`.
- Contact: `email`, `full_name`, `company_name`, `role_title`, `phone`.
- Firmographics: `industry`, `employee_count_range`, `annual_revenue_range`.
- Raw answers: `responses` (JSONB).
- Scores (post-`002`):  
  `data_security_compliance_score`, `operational_process_maturity_score`, `technology_infrastructure_score`, `team_change_management_score`, `financial_strategic_alignment_score`, `overall_score`.
- Outcomes: `readiness_tier`, `estimated_annual_savings`, `estimated_payback_months`, `recommended_next_step`, `pdf_url`.
- Marketing: `utm_*`, `booked_call_at`.

**`leads`**

- CRM-oriented rows keyed by email (unique on lowercased email), optional `assessment_id`, status workflow, `notes`.

**RLS:** Enabled; intended access via **service role** on the server for writes/reads as designed in migration comments.

---

## Frontend UI inventory

- **Pages:** `src/app/` includes marketing (`/`, `/about`, `/sample-report`, `/contact`, legal drafts), the assessment flow, `/results/[id]`, and related API routes.
- **Components:** Shared UI, assessment components, and marketing chrome under `src/components/`.

---

## Marketing copy note (consistency)

Public marketing and the five benefit cards on the landing page use the same domain names as `questions.json` and the scorer: *Data security & compliance; operational process maturity; technology infrastructure; team & change management; financial & strategic alignment.*

---

## Repository & docs

- **`README.md`** — features, stack, setup, env vars, migrations, Cloudflare deploy, project layout.
- **`CLAUDE.md`**, **`AGENTS.md`** — agent/editor notes (including Next.js version guidance in `AGENTS.md`).

---

## Summary

The codebase is a complete end-to-end product: data-driven question bank, scoring + tiering + recommendations, ROI banding, narrative insights, M365 gap analysis, assessment and results UI, PDF reports, email automation, Slack/Sentry monitoring, an admin dashboard, Supabase schema, and tests. It is deployed on Cloudflare Workers with Supabase and a verified Resend domain; `docs/LAUNCH-CHECKLIST.md` lists the remaining production checks (Calendly links, Slack, Sentry).
