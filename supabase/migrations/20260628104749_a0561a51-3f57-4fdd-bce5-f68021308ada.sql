
-- API Integrations: external stock APIs that feed PCM
CREATE TABLE public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('my_stock','competitor')),
  base_company_id UUID REFERENCES public.base_companies(id) ON DELETE SET NULL,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  http_method TEXT NOT NULL DEFAULT 'GET' CHECK (http_method IN ('GET','POST')),
  auth_header_name TEXT,
  auth_header_value TEXT,
  extra_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  body_template JSONB,
  field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  frequency TEXT NOT NULL DEFAULT 'manual' CHECK (frequency IN ('manual','daily','weekly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_integrations TO authenticated;
GRANT ALL ON public.api_integrations TO service_role;

ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read api_integrations" ON public.api_integrations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert api_integrations" ON public.api_integrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth update api_integrations" ON public.api_integrations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete api_integrations" ON public.api_integrations
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_api_integrations_updated
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public-safe view (no token exposed)
CREATE OR REPLACE VIEW public.api_integrations_public AS
SELECT id, user_id, name, target_type, base_company_id, competitor_id, url, http_method,
       auth_header_name,
       CASE WHEN auth_header_value IS NULL OR auth_header_value = '' THEN false ELSE true END AS has_auth_header_value,
       extra_headers, body_template, field_mapping, frequency, status,
       last_run_at, created_at, updated_at
FROM public.api_integrations;

GRANT SELECT ON public.api_integrations_public TO authenticated;

-- Logs
CREATE TABLE public.api_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.api_integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  url_called TEXT,
  http_status INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success','auth_error','format_error','unavailable','empty','failed')),
  vehicles_received INTEGER NOT NULL DEFAULT 0,
  vehicles_imported INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_integration_logs TO authenticated;
GRANT ALL ON public.api_integration_logs TO service_role;

ALTER TABLE public.api_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read api_integration_logs" ON public.api_integration_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert api_integration_logs" ON public.api_integration_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth delete api_integration_logs" ON public.api_integration_logs
  FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_api_integration_logs_integration ON public.api_integration_logs(integration_id, started_at DESC);
