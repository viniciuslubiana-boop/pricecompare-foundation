
-- Vehicle Master Catalog
CREATE TABLE public.vehicle_master_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text NOT NULL DEFAULT 'carro',
  brand text NOT NULL,
  canonical_model text NOT NULL,
  canonical_version text,
  displacement text,
  fuel text,
  transmission text,
  start_year int,
  end_year int,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_master_catalog_type_check CHECK (vehicle_type IN ('carro','moto'))
);

CREATE UNIQUE INDEX vehicle_master_catalog_unique
  ON public.vehicle_master_catalog (lower(brand), lower(canonical_model), lower(coalesce(canonical_version,'')), coalesce(start_year,0), coalesce(end_year,0));

CREATE INDEX vehicle_master_catalog_brand_idx ON public.vehicle_master_catalog (lower(brand));
CREATE INDEX vehicle_master_catalog_active_idx ON public.vehicle_master_catalog (active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_master_catalog TO authenticated;
GRANT ALL ON public.vehicle_master_catalog TO service_role;

ALTER TABLE public.vehicle_master_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vmc_select_authenticated"
  ON public.vehicle_master_catalog FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "vmc_admin_insert"
  ON public.vehicle_master_catalog FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vmc_admin_update"
  ON public.vehicle_master_catalog FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "vmc_admin_delete"
  ON public.vehicle_master_catalog FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER vmc_set_updated_at
  BEFORE UPDATE ON public.vehicle_master_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link aliases to master catalog
ALTER TABLE public.vehicle_model_aliases
  ADD COLUMN master_catalog_id uuid REFERENCES public.vehicle_master_catalog(id) ON DELETE SET NULL;

CREATE INDEX vehicle_model_aliases_master_catalog_idx
  ON public.vehicle_model_aliases (master_catalog_id);
