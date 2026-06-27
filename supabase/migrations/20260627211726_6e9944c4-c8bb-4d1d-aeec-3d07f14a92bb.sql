
CREATE TABLE public.market_update_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.market_update_runs TO authenticated;
GRANT ALL ON public.market_update_runs TO service_role;

ALTER TABLE public.market_update_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_runs_select_own_or_admin"
  ON public.market_update_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "market_runs_insert_self"
  ON public.market_update_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "market_runs_update_own"
  ON public.market_update_runs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_market_update_runs_user ON public.market_update_runs(user_id, started_at DESC);
