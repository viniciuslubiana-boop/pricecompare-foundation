
-- 1. base_companies table
CREATE TABLE IF NOT EXISTS public.base_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  website text,
  logo_url text,
  type text NOT NULL DEFAULT 'geral' CHECK (type IN ('carros','motos','geral')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.base_companies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.base_companies TO authenticated;
GRANT ALL ON public.base_companies TO service_role;

ALTER TABLE public.base_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "base_companies_select_authenticated"
  ON public.base_companies FOR SELECT TO authenticated USING (true);

CREATE POLICY "base_companies_insert_admin"
  ON public.base_companies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "base_companies_update_admin"
  ON public.base_companies FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "base_companies_delete_admin"
  ON public.base_companies FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- updated_at trigger
CREATE TRIGGER set_base_companies_updated_at
  BEFORE UPDATE ON public.base_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Enforce at most 2 active companies
CREATE OR REPLACE FUNCTION public.enforce_max_active_base_companies()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF (
      SELECT count(*) FROM public.base_companies
      WHERE status = 'active' AND id <> NEW.id
    ) >= 2 THEN
      RAISE EXCEPTION 'O sistema permite no máximo duas Empresas Base ativas.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_max_active_base_companies
  BEFORE INSERT OR UPDATE ON public.base_companies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_active_base_companies();

-- 3. my_vehicles.base_company_id
ALTER TABLE public.my_vehicles
  ADD COLUMN IF NOT EXISTS base_company_id uuid REFERENCES public.base_companies(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_my_vehicles_base_company_id ON public.my_vehicles(base_company_id);

-- 4. Seed default base company and backfill
DO $$
DECLARE
  v_id uuid;
  v_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.base_companies) THEN
    SELECT COALESCE(
      NULLIF((value->>'name')::text, ''),
      'Empresa Base Principal'
    )
    INTO v_name
    FROM public.app_settings
    WHERE key = 'referenceStore'
    LIMIT 1;

    IF v_name IS NULL THEN v_name := 'Empresa Base Principal'; END IF;

    INSERT INTO public.base_companies (name, type, status)
    VALUES (v_name, 'geral', 'active')
    RETURNING id INTO v_id;

    UPDATE public.my_vehicles SET base_company_id = v_id WHERE base_company_id IS NULL;
  END IF;
END $$;
