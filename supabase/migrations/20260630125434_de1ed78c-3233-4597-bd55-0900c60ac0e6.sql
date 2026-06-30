
ALTER TABLE public.html_intelligence_runs
  ADD COLUMN IF NOT EXISTS initial_method text,
  ADD COLUMN IF NOT EXISTS final_method text,
  ADD COLUMN IF NOT EXISTS fallback_reason text,
  ADD COLUMN IF NOT EXISTS recovered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspected_drop boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prior_avg_vehicles numeric;
