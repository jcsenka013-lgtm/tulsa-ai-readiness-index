-- =============================================================================
-- 004_email_infra — transactional email log + unsubscribe list
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: email_log
-- -----------------------------------------------------------------------------
create table if not exists public.email_log (
  id                  uuid primary key default gen_random_uuid(),
  assessment_id       uuid not null references public.assessments (id) on delete cascade,
  lead_email          text not null,
  email_type          text not null
    check (email_type in (
      'results_ready',
      'followup_24h',
      'followup_72h',
      'followup_7day',
      'abandoned_recovery'
    )),
  sent_at             timestamptz not null default now(),
  resend_message_id   text,
  status              text not null default 'sent'
    check (status in ('sent', 'failed', 'bounced')),
  error_message       text,
  unique (assessment_id, email_type)
);

create index if not exists email_log_lead_email_idx on public.email_log (lower(lead_email));
create index if not exists email_log_email_type_idx on public.email_log (email_type);

comment on table public.email_log is
  'One row per transactional email attempt; unique (assessment_id, email_type) prevents duplicate sequence sends.';

-- -----------------------------------------------------------------------------
-- Table: unsubscribes
-- -----------------------------------------------------------------------------
create table if not exists public.unsubscribes (
  email             text primary key,
  unsubscribed_at   timestamptz not null default now(),
  reason            text,
  source            text not null default 'link'
    check (source in ('link', 'complaint', 'manual'))
);

comment on table public.unsubscribes is
  'Marketing / sequence opt-outs. Email is stored lowercase.';

create or replace function public.unsubscribes_normalize_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists unsubscribes_normalize_email_trg on public.unsubscribes;
create trigger unsubscribes_normalize_email_trg
  before insert or update on public.unsubscribes
  for each row
  execute function public.unsubscribes_normalize_email();

-- -----------------------------------------------------------------------------
-- Row Level Security (service role documented; service key bypasses RLS)
-- -----------------------------------------------------------------------------
alter table public.email_log    enable row level security;
alter table public.unsubscribes enable row level security;

drop policy if exists "service_role full access" on public.email_log;
create policy "service_role full access"
  on public.email_log
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role full access" on public.unsubscribes;
create policy "service_role full access"
  on public.unsubscribes
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
