
-- 1) Tabela de referências FIPE (cache de consultas)
CREATE TABLE public.fipe_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type TEXT NOT NULL DEFAULT 'cars',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year_model INTEGER NOT NULL,
  fuel TEXT,
  fipe_code TEXT,
  fipe_value NUMERIC(14,2) NOT NULL,
  reference_month TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'parallelum',
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fipe_references TO authenticated;
GRANT ALL ON public.fipe_references TO service_role;

ALTER TABLE public.fipe_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fipe_references_select_auth"
  ON public.fipe_references FOR SELECT TO authenticated USING (true);
CREATE POLICY "fipe_references_insert_auth"
  ON public.fipe_references FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fipe_references_update_auth"
  ON public.fipe_references FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fipe_references_delete_admin"
  ON public.fipe_references FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_fipe_refs_brand ON public.fipe_references (lower(brand));
CREATE INDEX idx_fipe_refs_model ON public.fipe_references (lower(model));
CREATE INDEX idx_fipe_refs_year ON public.fipe_references (year_model);
CREATE INDEX idx_fipe_refs_code ON public.fipe_references (fipe_code);
CREATE INDEX idx_fipe_refs_ref_month ON public.fipe_references (reference_month);
CREATE UNIQUE INDEX uq_fipe_refs_code_year_month
  ON public.fipe_references (fipe_code, year_model, reference_month)
  WHERE fipe_code IS NOT NULL;

CREATE TRIGGER trg_fipe_refs_updated_at
  BEFORE UPDATE ON public.fipe_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tabela de logs de atualização FIPE
CREATE TABLE public.fipe_update_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_company_id UUID REFERENCES public.base_companies(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'parallelum',
  total_vehicles INTEGER NOT NULL DEFAULT 0,
  matched INTEGER NOT NULL DEFAULT 0,
  unmatched INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fipe_update_logs TO authenticated;
GRANT ALL ON public.fipe_update_logs TO service_role;

ALTER TABLE public.fipe_update_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fipe_logs_select_auth"
  ON public.fipe_update_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "fipe_logs_insert_auth"
  ON public.fipe_update_logs FOR INSERT TO authenticated
  WITH CHECK (triggered_by = auth.uid());

-- 3) Campos FIPE em my_vehicles
ALTER TABLE public.my_vehicles
  ADD COLUMN IF NOT EXISTS fipe_code TEXT,
  ADD COLUMN IF NOT EXISTS fipe_value NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS fipe_reference_month TEXT,
  ADD COLUMN IF NOT EXISTS fipe_status TEXT NOT NULL DEFAULT 'nao_verificada',
  ADD COLUMN IF NOT EXISTS fipe_linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fipe_link_mode TEXT;

CREATE INDEX IF NOT EXISTS idx_my_vehicles_fipe_status ON public.my_vehicles (fipe_status);
CREATE INDEX IF NOT EXISTS idx_my_vehicles_fipe_code ON public.my_vehicles (fipe_code);

-- 4) Configuração de provedor FIPE em app_settings
INSERT INTO public.app_settings (key, value)
VALUES ('fipe_provider', jsonb_build_object(
  'active', 'parallelum',
  'available', jsonb_build_array('parallelum', 'commercial'),
  'parallelum', jsonb_build_object('base_url', 'https://parallelum.com.br/fipe/api/v1'),
  'commercial', jsonb_build_object('base_url', '', 'requires_secret', 'FIPE_COMMERCIAL_API_KEY')
))
ON CONFLICT (key) DO NOTHING;
