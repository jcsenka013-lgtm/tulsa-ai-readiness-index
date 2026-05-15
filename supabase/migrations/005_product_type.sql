-- =============================================================================
-- 005_product_type — shared assessments across Tulsa AI Readiness + Copilot
-- =============================================================================
--
-- MUST be applied in production (Supabase SQL Editor or CLI) before any
-- Copilot flow code is deployed that reads/writes product_type.
-- =============================================================================

alter table public.assessments
  add column if not exists product_type text not null default 'ai_readiness'
    check (product_type in ('ai_readiness', 'copilot_readiness'));

create index if not exists idx_assessments_product_type
  on public.assessments (product_type);

alter table public.leads
  add column if not exists source_product text
    check (source_product in ('ai_readiness', 'copilot_readiness'));

update public.leads
  set source_product = 'ai_readiness'
  where source_product is null;

-- Helpful view for the admin dashboard (product × status × tier × week).
create or replace view public.assessments_by_product as
select
  product_type,
  status,
  readiness_tier,
  date_trunc('week', created_at) as week,
  count(*) as count
from public.assessments
group by
  product_type,
  status,
  readiness_tier,
  date_trunc('week', created_at);

comment on column public.assessments.product_type is
  'Which entry point / assessment product this row belongs to.';
comment on column public.leads.source_product is
  'Product the lead originated from; mirrors assessments.product_type.';
