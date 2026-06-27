
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;

GRANT USAGE ON TYPE public.app_role TO authenticated, anon, service_role;
