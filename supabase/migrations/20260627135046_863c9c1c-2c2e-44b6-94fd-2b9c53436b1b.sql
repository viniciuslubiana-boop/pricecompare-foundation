
-- =========================================================
-- Extend profiles
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- =========================================================
-- Helper functions
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- =========================================================
-- my_vehicles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.my_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year_model text NOT NULL,
  km integer,
  price numeric(12,2),
  supplier_name text,
  source text NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_vehicles TO authenticated;
GRANT ALL ON public.my_vehicles TO service_role;
ALTER TABLE public.my_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "my_vehicles_select_auth" ON public.my_vehicles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "my_vehicles_insert_mgr" ON public.my_vehicles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "my_vehicles_update_mgr" ON public.my_vehicles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "my_vehicles_delete_admin" ON public.my_vehicles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_my_vehicles_updated
  BEFORE UPDATE ON public.my_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_my_vehicles_brand ON public.my_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_my_vehicles_model ON public.my_vehicles(model);
CREATE INDEX IF NOT EXISTS idx_my_vehicles_year ON public.my_vehicles(year_model);
CREATE INDEX IF NOT EXISTS idx_my_vehicles_created_by ON public.my_vehicles(created_by);

-- =========================================================
-- competitors
-- =========================================================
CREATE TABLE IF NOT EXISTS public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitors TO authenticated;
GRANT ALL ON public.competitors TO service_role;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitors_select_auth" ON public.competitors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "competitors_insert_mgr" ON public.competitors
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "competitors_update_mgr" ON public.competitors
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "competitors_delete_admin" ON public.competitors
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_competitors_updated
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_competitors_status ON public.competitors(status);
CREATE INDEX IF NOT EXISTS idx_competitors_created_by ON public.competitors(created_by);

-- =========================================================
-- extraction_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES public.competitors(id) ON DELETE SET NULL,
  url text NOT NULL,
  total_pages integer NOT NULL DEFAULT 0,
  pages_processed integer NOT NULL DEFAULT 0,
  vehicles_found integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  error_log jsonb,
  checkpoint_page integer NOT NULL DEFAULT 1,
  started_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extraction_logs TO authenticated;
GRANT ALL ON public.extraction_logs TO service_role;
ALTER TABLE public.extraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extraction_logs_select_auth" ON public.extraction_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "extraction_logs_insert_mgr" ON public.extraction_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "extraction_logs_update_mgr" ON public.extraction_logs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "extraction_logs_delete_admin" ON public.extraction_logs
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_extraction_logs_competitor ON public.extraction_logs(competitor_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_status ON public.extraction_logs(status);

-- =========================================================
-- competitor_vehicles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.competitor_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year_model text NOT NULL,
  km integer,
  price numeric(12,2),
  competitor_name text,
  source_url text,
  extraction_id uuid REFERENCES public.extraction_logs(id) ON DELETE CASCADE,
  confidence jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_vehicles TO authenticated;
GRANT ALL ON public.competitor_vehicles TO service_role;
ALTER TABLE public.competitor_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_vehicles_select_auth" ON public.competitor_vehicles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "competitor_vehicles_insert_mgr" ON public.competitor_vehicles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "competitor_vehicles_update_mgr" ON public.competitor_vehicles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "competitor_vehicles_delete_admin" ON public.competitor_vehicles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_competitor_vehicles_updated
  BEFORE UPDATE ON public.competitor_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cv_brand ON public.competitor_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_cv_model ON public.competitor_vehicles(model);
CREATE INDEX IF NOT EXISTS idx_cv_year ON public.competitor_vehicles(year_model);
CREATE INDEX IF NOT EXISTS idx_cv_extraction ON public.competitor_vehicles(extraction_id);

-- =========================================================
-- comparisons
-- =========================================================
CREATE TABLE IF NOT EXISTS public.comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  my_vehicle_id uuid REFERENCES public.my_vehicles(id) ON DELETE CASCADE,
  competitor_vehicle_id uuid REFERENCES public.competitor_vehicles(id) ON DELETE CASCADE,
  compatibility_score integer CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  winner text CHECK (winner IN ('me','competitor','tie','unmatched')),
  savings numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comparisons TO authenticated;
GRANT ALL ON public.comparisons TO service_role;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparisons_select_auth" ON public.comparisons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comparisons_insert_mgr" ON public.comparisons
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "comparisons_update_mgr" ON public.comparisons
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "comparisons_delete_admin" ON public.comparisons
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_comparisons_score ON public.comparisons(compatibility_score);

-- =========================================================
-- app_settings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_select_auth" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_settings_write_admin" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- import_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text,
  file_type text,
  rows_received integer NOT NULL DEFAULT 0,
  rows_imported integer NOT NULL DEFAULT 0,
  rows_failed integer NOT NULL DEFAULT 0,
  status text CHECK (status IN ('pending','completed','partial','failed')),
  error_log jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_logs_select_auth" ON public.import_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_logs_insert_mgr" ON public.import_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));
CREATE POLICY "import_logs_update_admin" ON public.import_logs
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "import_logs_delete_admin" ON public.import_logs
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_import_logs_status ON public.import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_by ON public.import_logs(created_by);

-- =========================================================
-- ai_logs (admin-only read)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  input_summary text,
  output_summary text,
  tokens_used integer,
  cost_estimate numeric(12,4),
  status text CHECK (status IN ('success','failed')),
  error_message text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_logs TO authenticated;
GRANT ALL ON public.ai_logs TO service_role;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_select_admin" ON public.ai_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "ai_logs_insert_auth" ON public.ai_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ai_logs_modify_admin" ON public.ai_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_ai_logs_created_by ON public.ai_logs(created_by);

-- =========================================================
-- audit_logs (admin-only read)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  module text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);

-- =========================================================
-- Views
-- =========================================================
CREATE OR REPLACE VIEW public.view_dashboard_summary AS
SELECT
  (SELECT count(*) FROM public.my_vehicles)            AS total_my_vehicles,
  (SELECT count(*) FROM public.competitors)            AS total_competitors,
  (SELECT count(*) FROM public.competitor_vehicles)    AS total_competitor_vehicles,
  (SELECT count(*) FROM public.comparisons)            AS total_comparisons,
  (SELECT count(*) FROM public.extraction_logs WHERE status = 'running') AS running_extractions;

CREATE OR REPLACE VIEW public.view_recent_comparisons AS
SELECT c.id, c.compatibility_score, c.winner, c.savings, c.created_at,
       mv.brand AS my_brand, mv.model AS my_model, mv.price AS my_price,
       cv.brand AS competitor_brand, cv.model AS competitor_model,
       cv.price AS competitor_price, cv.competitor_name
FROM public.comparisons c
LEFT JOIN public.my_vehicles mv ON mv.id = c.my_vehicle_id
LEFT JOIN public.competitor_vehicles cv ON cv.id = c.competitor_vehicle_id
ORDER BY c.created_at DESC
LIMIT 50;

CREATE OR REPLACE VIEW public.view_price_distribution AS
SELECT brand, model, year_model,
       count(*) AS qty,
       avg(price)::numeric(12,2) AS avg_price,
       min(price) AS min_price,
       max(price) AS max_price
FROM public.competitor_vehicles
WHERE price IS NOT NULL
GROUP BY brand, model, year_model;

GRANT SELECT ON public.view_dashboard_summary TO authenticated;
GRANT SELECT ON public.view_recent_comparisons TO authenticated;
GRANT SELECT ON public.view_price_distribution TO authenticated;
