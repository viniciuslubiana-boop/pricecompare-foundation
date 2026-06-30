
ALTER TABLE public.html_intelligence_runs
  ADD COLUMN IF NOT EXISTS actions_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scroll_cycles integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS load_more_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pagination_detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS embedded_json_detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS structured_data_detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS raw_items_found integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS technical_preview jsonb NOT NULL DEFAULT '{}'::jsonb;
