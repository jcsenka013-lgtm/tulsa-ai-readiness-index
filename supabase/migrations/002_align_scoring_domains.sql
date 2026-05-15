-- =============================================================================
-- 002_align_scoring_domains
--
-- Re-align the score columns on `assessments` to match the five domains
-- defined in `src/lib/questions/questions.json` (v1.0.0):
--
--   • data_security_compliance
--   • operational_process_maturity
--   • technology_infrastructure
--   • team_change_management
--   • financial_strategic_alignment
--
-- The previous migration used an older five-dimension model (data_readiness,
-- security_compliance, process_maturity, team_readiness, use_case_clarity).
-- Since no rows exist yet, we drop the old columns and add the new ones
-- cleanly instead of doing a data migration.
-- =============================================================================

alter table public.assessments
  drop column if exists data_readiness_score,
  drop column if exists security_compliance_score,
  drop column if exists process_maturity_score,
  drop column if exists team_readiness_score,
  drop column if exists use_case_clarity_score;

alter table public.assessments
  add column if not exists data_security_compliance_score      integer
    check (data_security_compliance_score       between 0 and 100),
  add column if not exists operational_process_maturity_score  integer
    check (operational_process_maturity_score   between 0 and 100),
  add column if not exists technology_infrastructure_score     integer
    check (technology_infrastructure_score      between 0 and 100),
  add column if not exists team_change_management_score        integer
    check (team_change_management_score         between 0 and 100),
  add column if not exists financial_strategic_alignment_score integer
    check (financial_strategic_alignment_score  between 0 and 100);

comment on column public.assessments.data_security_compliance_score      is
  'Domain score 0-100 for Data Security & Compliance Posture.';
comment on column public.assessments.operational_process_maturity_score  is
  'Domain score 0-100 for Operational Process Maturity.';
comment on column public.assessments.technology_infrastructure_score     is
  'Domain score 0-100 for Technology Infrastructure Readiness.';
comment on column public.assessments.team_change_management_score        is
  'Domain score 0-100 for Team & Change Management.';
comment on column public.assessments.financial_strategic_alignment_score is
  'Domain score 0-100 for Financial & Strategic Alignment.';
