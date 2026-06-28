
-- competitors: restrict SELECT to admin/gerente (phone exposure)
DROP POLICY IF EXISTS competitors_select_auth ON public.competitors;
CREATE POLICY competitors_select_mgr ON public.competitors
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- app_settings: restrict SELECT to admin/gerente
DROP POLICY IF EXISTS app_settings_select_auth ON public.app_settings;
CREATE POLICY app_settings_select_mgr ON public.app_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- market_changes: restrict INSERT to admin/gerente
DROP POLICY IF EXISTS "Authenticated insert market changes" ON public.market_changes;
CREATE POLICY market_changes_insert_mgr ON public.market_changes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

-- SECURITY DEFINER functions: revoke from public/anon/authenticated; re-grant only where required.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
