
CREATE TABLE public.html_intelligence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url text NOT NULL,
  chosen_route text,
  chosen_score integer NOT NULL DEFAULT 0,
  candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  vehicles_estimated integer NOT NULL DEFAULT 0,
  processing_ms integer NOT NULL DEFAULT 0,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.html_intelligence_runs TO authenticated;
GRANT ALL ON public.html_intelligence_runs TO service_role;

ALTER TABLE public.html_intelligence_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "html_runs_select_authenticated"
  ON public.html_intelligence_runs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "html_runs_insert_authenticated"
  ON public.html_intelligence_runs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "html_runs_update_admin"
  ON public.html_intelligence_runs FOR UPDATE
  TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "html_runs_delete_admin"
  ON public.html_intelligence_runs FOR DELETE
  TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER html_intelligence_runs_set_updated_at
  BEFORE UPDATE ON public.html_intelligence_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX html_intelligence_runs_created_at_idx
  ON public.html_intelligence_runs (created_at DESC);
