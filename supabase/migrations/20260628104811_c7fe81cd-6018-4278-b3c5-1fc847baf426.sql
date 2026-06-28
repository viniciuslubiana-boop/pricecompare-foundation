
ALTER VIEW public.api_integrations_public SET (security_invoker = true);

DROP POLICY IF EXISTS "auth update api_integrations" ON public.api_integrations;
DROP POLICY IF EXISTS "auth delete api_integrations" ON public.api_integrations;
DROP POLICY IF EXISTS "auth insert api_integration_logs" ON public.api_integration_logs;
DROP POLICY IF EXISTS "auth delete api_integration_logs" ON public.api_integration_logs;

CREATE POLICY "owner update api_integrations" ON public.api_integrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner delete api_integrations" ON public.api_integrations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "auth insert own logs" ON public.api_integration_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "auth delete logs" ON public.api_integration_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
