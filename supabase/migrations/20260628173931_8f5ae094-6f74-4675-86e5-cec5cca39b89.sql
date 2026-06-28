
-- Extend import_logs to support competitor target
ALTER TABLE public.import_logs
  ADD COLUMN IF NOT EXISTS import_target_type text NOT NULL DEFAULT 'my_vehicles'
    CHECK (import_target_type IN ('my_vehicles','competitor')),
  ADD COLUMN IF NOT EXISTS base_company_id uuid REFERENCES public.base_companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competitor_id uuid REFERENCES public.competitors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rows_duplicated integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_import_logs_target ON public.import_logs(import_target_type);
CREATE INDEX IF NOT EXISTS idx_import_logs_competitor ON public.import_logs(competitor_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_base_company ON public.import_logs(base_company_id);

-- Extend competitor_vehicles to capture additional fields from file imports
ALTER TABLE public.competitor_vehicles
  ADD COLUMN IF NOT EXISTS competitor_id uuid REFERENCES public.competitors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS source text;

CREATE INDEX IF NOT EXISTS idx_cv_competitor_id ON public.competitor_vehicles(competitor_id);
