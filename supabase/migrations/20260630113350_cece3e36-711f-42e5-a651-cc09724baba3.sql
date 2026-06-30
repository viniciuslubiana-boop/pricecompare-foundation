-- Enum
DO $$ BEGIN
  CREATE TYPE public.source_method AS ENUM (
    'PLATFORM_PROFILE',
    'OFFICIAL_API',
    'PUBLIC_API',
    'GRAPHQL',
    'JSON',
    'EMBEDDED_JSON',
    'XML',
    'SITEMAP',
    'HTML',
    'RENDERED_HTML',
    'FILE_IMPORT',
    'UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- market_source_profiles
CREATE TABLE public.market_source_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technology TEXT NOT NULL,
  source_method public.source_method NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 50,
  selector_strategy JSONB,
  pagination_strategy JSONB,
  vehicle_card_strategy JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (technology, source_method)
);

CREATE INDEX idx_msp_tech_active
  ON public.market_source_profiles (technology, active, priority DESC, confidence DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_source_profiles TO authenticated;
GRANT ALL ON public.market_source_profiles TO service_role;

ALTER TABLE public.market_source_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view source profiles"
  ON public.market_source_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert source profiles"
  ON public.market_source_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update source profiles"
  ON public.market_source_profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete source profiles"
  ON public.market_source_profiles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_msp_updated_at
  BEFORE UPDATE ON public.market_source_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- market_source_history
CREATE TABLE public.market_source_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  company_type public.acquisition_company_type NOT NULL,
  url TEXT NOT NULL,
  method_used public.source_method NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  vehicles_found INTEGER NOT NULL DEFAULT 0,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  fallback_chain JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msh_company ON public.market_source_history (company_type, company_id);
CREATE INDEX idx_msh_created_at ON public.market_source_history (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_source_history TO authenticated;
GRANT ALL ON public.market_source_history TO service_role;

ALTER TABLE public.market_source_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view source history"
  ON public.market_source_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert source history"
  ON public.market_source_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update source history"
  ON public.market_source_history FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete source history"
  ON public.market_source_history FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Seeds (prioridade maior = preferido primeiro)
INSERT INTO public.market_source_profiles (technology, source_method, priority, confidence) VALUES
  ('RevendaMais',        'PLATFORM_PROFILE', 100, 95),
  ('RevendaMais',        'PUBLIC_API',        90, 85),
  ('RevendaMais',        'HTML',              50, 60),
  ('DealerSites',        'PLATFORM_PROFILE', 100, 95),
  ('DealerSites',        'HTML',              60, 70),
  ('Shopify',            'PUBLIC_API',        95, 90),
  ('Shopify',            'JSON',              80, 80),
  ('Shopify',            'HTML',              50, 60),
  ('WordPress',          'PUBLIC_API',        85, 80),
  ('WordPress',          'HTML',              70, 70),
  ('Next.js',            'EMBEDDED_JSON',     90, 85),
  ('Next.js',            'RENDERED_HTML',     70, 70),
  ('React',              'EMBEDDED_JSON',     80, 75),
  ('React',              'RENDERED_HTML',     70, 70),
  ('Vue',                'EMBEDDED_JSON',     80, 75),
  ('Vue',                'RENDERED_HTML',     70, 70),
  ('Angular',            'RENDERED_HTML',     80, 75),
  ('Laravel',            'HTML',              80, 75),
  ('Laravel',            'JSON',              60, 65),
  ('ASP.NET',            'HTML',              80, 70),
  ('PHP',                'HTML',              80, 70),
  ('Plataforma Própria', 'HTML',              60, 55),
  ('Plataforma Própria', 'RENDERED_HTML',     55, 55),
  ('Plataforma Própria', 'SITEMAP',           40, 50),
  ('Desconhecida',       'HTML',              50, 40),
  ('Desconhecida',       'RENDERED_HTML',     45, 40),
  ('Desconhecida',       'SITEMAP',           40, 35),
  ('Desconhecida',       'FILE_IMPORT',       20, 30);