-- =============================================================================
-- 007_pin_function_search_path
-- Supabase security advisor 0011: pin search_path on trigger functions so a
-- caller-controlled search_path cannot redirect unqualified references.
-- =============================================================================

alter function public.unsubscribes_normalize_email() set search_path = '';
