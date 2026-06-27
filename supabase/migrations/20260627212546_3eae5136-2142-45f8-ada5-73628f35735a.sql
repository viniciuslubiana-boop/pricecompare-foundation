
CREATE TABLE public.market_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.market_update_runs(id) ON DELETE CASCADE,
  competitor_id uuid,
  competitor_name text NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('new','removed','price','km')),
  vehicle_key text NOT NULL,
  brand text,
  model text,
  year_model text,
  previous_price numeric,
  current_price numeric,
  price_diff numeric,
  price_diff_pct numeric,
  previous_km integer,
  current_km integer,
  km_diff integer,
  summary text,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_changes_run ON public.market_changes(run_id);
CREATE INDEX idx_market_changes_detected_at ON public.market_changes(detected_at DESC);
CREATE INDEX idx_market_changes_type ON public.market_changes(change_type);
CREATE INDEX idx_market_changes_competitor ON public.market_changes(competitor_name);

GRANT SELECT, INSERT ON public.market_changes TO authenticated;
GRANT ALL ON public.market_changes TO service_role;

ALTER TABLE public.market_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read market changes"
  ON public.market_changes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated insert market changes"
  ON public.market_changes FOR INSERT
  TO authenticated WITH CHECK (true);
