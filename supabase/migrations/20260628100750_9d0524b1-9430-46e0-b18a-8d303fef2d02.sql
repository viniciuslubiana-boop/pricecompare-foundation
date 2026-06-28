
REVOKE EXECUTE ON FUNCTION public.enforce_max_active_base_companies() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.enforce_max_active_base_companies() TO service_role;
