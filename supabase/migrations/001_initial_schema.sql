-- =============================================================================
-- Tulsa AI Readiness Index — Initial Schema
--
-- Creates the two core tables backing the assessment flow:
--   1. public.assessments — one row per assessment attempt (in-progress or done)
--   2. public.leads       — CRM-style view of captured contacts
--
-- RLS is enabled on both tables and locked down by default. All writes go
-- through server code using the service-role key, which bypasses RLS. We
-- add explicit `service_role` policies so intent is obvious in the schema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: assessments
-- -----------------------------------------------------------------------------
create table if not exists public.assessments (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  completed_at                timestamptz,

  status                      text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),

  -- Contact info (captured mid-flow or at end)
  email                       text,
  full_name                   text,
  company_name                text,
  role_title                  text,
  phone                       text,

  -- Firmographics
  industry                    text
    check (industry in (
      'dental',
      'insurance',
      'oil_gas',
      'legal',
      'professional_services',
      'healthcare_other',
      'other'
    )),
  employee_count_range        text
    check (employee_count_range in ('1-5', '6-20', '21-50', '51-100', '100+')),
  annual_revenue_range        text,

  -- Raw answers (keyed by question id)
  responses                   jsonb not null default '{}'::jsonb,

  -- Computed scores (0-100)
  data_readiness_score        integer check (data_readiness_score between 0 and 100),
  security_compliance_score   integer check (security_compliance_score between 0 and 100),
  process_maturity_score      integer check (process_maturity_score between 0 and 100),
  team_readiness_score        integer check (team_readiness_score between 0 and 100),
  use_case_clarity_score      integer check (use_case_clarity_score between 0 and 100),
  overall_score               integer check (overall_score between 0 and 100),

  readiness_tier              text
    check (readiness_tier in ('foundation', 'exploration', 'pilot', 'scale')),

  -- ROI projection
  estimated_annual_savings    integer,
  estimated_payback_months    numeric(5,1),

  recommended_next_step       text
    check (recommended_next_step in (
      'audit',
      'pilot',
      'retainer',
      'foundation_work'
    )),

  pdf_url                     text,

  -- Attribution
  utm_source                  text,
  utm_medium                  text,
  utm_campaign                text,

  -- Conversion tracking
  booked_call_at              timestamptz
);

comment on table public.assessments is
  'One row per AI readiness assessment attempt. Populated incrementally as the user moves through the flow.';

create index if not exists assessments_status_idx        on public.assessments (status);
create index if not exists assessments_email_idx         on public.assessments (email);
create index if not exists assessments_created_at_idx    on public.assessments (created_at desc);
create index if not exists assessments_completed_at_idx  on public.assessments (completed_at desc);

-- -----------------------------------------------------------------------------
-- Table: leads
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid references public.assessments (id) on delete set null,

  email           text not null,
  full_name       text,
  company_name    text,
  phone           text,

  created_at      timestamptz not null default now(),
  contacted_at    timestamptz,

  status          text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'disqualified', 'booked', 'customer')),

  notes           text
);

comment on table public.leads is
  'Denormalized, CRM-friendly view of captured contacts. One row per unique email from an assessment.';

create unique index if not exists leads_email_uniq_idx    on public.leads (lower(email));
create index        if not exists leads_status_idx        on public.leads (status);
create index        if not exists leads_created_at_idx    on public.leads (created_at desc);
create index        if not exists leads_assessment_id_idx on public.leads (assessment_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- Both tables are fully locked down to `anon` and `authenticated`. Every
-- read and write goes through server code using the service-role key, which
-- bypasses RLS. The explicit `service_role` policies below document intent
-- and are a safety net in case the role ever changes.
-- -----------------------------------------------------------------------------
alter table public.assessments enable row level security;
alter table public.leads       enable row level security;

-- Permissive service-role policies (RLS is bypassed by service_role, but
-- we declare these so the access model is self-documenting).
drop policy if exists "service_role full access"   on public.assessments;
create policy "service_role full access"
  on public.assessments
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role full access"   on public.leads;
create policy "service_role full access"
  on public.leads
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
