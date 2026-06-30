
-- Mini-Sprint 4C: Source Score + rate limit
CREATE TABLE IF NOT EXISTS public.market_source_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  company_type text NOT NULL CHECK (company_type IN ('base_company','competitor')),
  url text NOT NULL,
  source_method text NOT NULL,
  route_url text NULL,
  html_score numeric NOT NULL DEFAULT 0,
  source_score numeric NOT NULL DEFAULT 0,
  coverage_score numeric NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 0,
  performance_score numeric NOT NULL DEFAULT 0,
  stability_score numeric NOT NULL DEFAULT 0,
  success_rate numeric NOT NULL DEFAULT 0,
  raw_items_found integer NOT NULL DEFAULT 0,
  vehicles_estimated integer NOT NULL DEFAULT 0,
  actions_used boolean NOT NULL DEFAULT false,
  fallback_used boolean NOT NULL DEFAULT false,
  last_success_at timestamptz NULL,
  last_failure_at timestamptz NULL,
  executions_total integer NOT NULL DEFAULT 0,
  executions_success integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (url, source_method)
);

CREATE INDEX IF NOT EXISTS idx_market_source_scores_company ON public.market_source_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_market_source_scores_url ON public.market_source_scores(url);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_source_scores TO authenticated;
GRANT ALL ON public.market_source_scores TO service_role;

ALTER TABLE public.market_source_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read scores" ON public.market_source_scores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert scores" ON public.market_source_scores
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update scores" ON public.market_source_scores
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin delete scores" ON public.market_source_scores
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_market_source_scores_updated_at
  BEFORE UPDATE ON public.market_source_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
