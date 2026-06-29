
DROP POLICY IF EXISTS "auth read api_integrations" ON public.api_integrations;
CREATE POLICY "owner read api_integrations" ON public.api_integrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "auth read api_integration_logs" ON public.api_integration_logs;
CREATE POLICY "owner read api_integration_logs" ON public.api_integration_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_insert_self" ON public.audit_logs;
