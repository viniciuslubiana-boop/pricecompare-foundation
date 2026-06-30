
ALTER TABLE public.html_intelligence_runs
  ADD COLUMN IF NOT EXISTS normalized_preview jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS normalization_confidence_avg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS normalization_status_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_model text,
  ADD COLUMN IF NOT EXISTS ai_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_duration_ms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS normalization_errors jsonb NOT NULL DEFAULT '[]'::jsonb;
