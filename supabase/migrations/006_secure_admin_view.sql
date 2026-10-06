-- =============================================================================
-- 006_secure_admin_view
-- Views bypass RLS by default, so assessments_by_product was readable with the
-- public anon key. Run it with the caller's permissions and restrict it to the
-- service role, matching the underlying tables.
-- =============================================================================

alter view public.assessments_by_product set (security_invoker = true);

revoke all on public.assessments_by_product from anon, authenticated;
