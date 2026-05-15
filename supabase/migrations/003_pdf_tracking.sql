-- =============================================================================
-- 003_pdf_tracking
--
-- Tracks how many times the downloadable PDF report was requested via GET
-- /api/assessment/[id]/pdf (each redirect to a signed URL counts as one).
-- =============================================================================

alter table public.assessments
  add column if not exists pdf_download_count integer not null default 0;

comment on column public.assessments.pdf_download_count is
  'Incremented on each GET /api/assessment/[id]/pdf that redirects to a signed PDF URL.';

-- -----------------------------------------------------------------------------
-- Supabase Storage: reports bucket (create manually in dashboard)
--
-- The application uploads generated PDFs to Storage and stores the object
-- path in assessments.pdf_url (filename only: "<uuid>.pdf").
--
-- Create in Supabase Dashboard → Storage → New bucket:
--   Name:                 reports
--   Public bucket:        OFF (private)
--   File size limit:      10 MB
--   Allowed MIME types:   application/pdf
--
-- Service role (used by the API) bypasses RLS; ensure no public policies
-- expose this bucket. Signed URLs are minted server-side (7-day expiry).
-- -----------------------------------------------------------------------------
