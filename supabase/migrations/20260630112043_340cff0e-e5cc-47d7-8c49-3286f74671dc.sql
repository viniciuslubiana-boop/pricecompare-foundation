
DO $$ BEGIN
  CREATE TYPE public.acquisition_method AS ENUM ('API','JSON','HTML','RENDERED_HTML','FILE_IMPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acquisition_company_type AS ENUM ('base_company','competitor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.acquisition_status AS ENUM ('pending','running','success','partial','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.market_acquisition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  company_type public.acquisition_company_type NOT NULL,
  url TEXT,
  method public.acquisition_method NOT NULL,
  status public.acquisition_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  vehicles_found INTEGER NOT NULL DEFAULT 0,
  vehicles_saved INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_acquisition_logs TO authenticated;
GRANT ALL ON public.market_acquisition_logs TO service_role;

ALTER TABLE public.market_acquisition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view acquisition logs"
  ON public.market_acquisition_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert acquisition logs"
  ON public.market_acquisition_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update acquisition logs"
  ON public.market_acquisition_logs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete acquisition logs"
  ON public.market_acquisition_logs FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_mal_company ON public.market_acquisition_logs(company_id, company_type);
CREATE INDEX IF NOT EXISTS idx_mal_started_at ON public.market_acquisition_logs(started_at DESC);

CREATE TRIGGER set_market_acquisition_logs_updated_at
  BEFORE UPDATE ON public.market_acquisition_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
