
ALTER VIEW public.view_dashboard_summary SET (security_invoker = true);
ALTER VIEW public.view_recent_comparisons SET (security_invoker = true);
ALTER VIEW public.view_price_distribution SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

DROP POLICY IF EXISTS "ai_logs_insert_auth" ON public.ai_logs;
CREATE POLICY "ai_logs_insert_self" ON public.ai_logs
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_insert_auth" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_self" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
