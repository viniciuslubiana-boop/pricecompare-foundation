
CREATE TABLE public.vehicle_model_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  alias text NOT NULL,
  canonical text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand, alias)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_model_aliases TO authenticated;
GRANT ALL ON public.vehicle_model_aliases TO service_role;

ALTER TABLE public.vehicle_model_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alias_select_authenticated" ON public.vehicle_model_aliases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alias_modify_admin" ON public.vehicle_model_aliases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_alias_updated_at
  BEFORE UPDATE ON public.vehicle_model_aliases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_alias_brand ON public.vehicle_model_aliases(brand);
