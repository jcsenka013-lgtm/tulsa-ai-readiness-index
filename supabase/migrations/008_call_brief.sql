-- =============================================================================
-- 008_call_brief
-- Stores the Claude-generated discovery-call brief shown on /admin/leads/[id],
-- so each brief is generated once instead of on every page view.
-- =============================================================================

alter table public.assessments
  add column if not exists call_brief jsonb,
  add column if not exists call_brief_generated_at timestamptz;

comment on column public.assessments.call_brief is
  'Admin-only discovery-call brief (see src/lib/assistant/call-brief.ts). Never returned by public routes.';
