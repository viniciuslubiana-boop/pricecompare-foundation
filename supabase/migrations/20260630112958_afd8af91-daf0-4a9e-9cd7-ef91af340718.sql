CREATE TABLE public.site_discovery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  company_type public.acquisition_company_type NOT NULL,
  url TEXT NOT NULL,
  technology TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  html_signature JSONB,
  framework_signature JSONB,
  discovery_time_ms INTEGER,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_discovery_company ON public.site_discovery (company_type, company_id);
CREATE INDEX idx_site_discovery_detected_at ON public.site_discovery (detected_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_discovery TO authenticated;
GRANT ALL ON public.site_discovery TO service_role;

ALTER TABLE public.site_discovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view site discovery"
  ON public.site_discovery FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert site discovery"
  ON public.site_discovery FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update site discovery"
  ON public.site_discovery FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete site discovery"
  ON public.site_discovery FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_site_discovery_updated_at
  BEFORE UPDATE ON public.site_discovery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();