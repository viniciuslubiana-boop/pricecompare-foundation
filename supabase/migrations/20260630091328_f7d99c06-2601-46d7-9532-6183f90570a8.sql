-- Remove FIPE module completely
DROP TABLE IF EXISTS public.fipe_update_logs CASCADE;
DROP TABLE IF EXISTS public.fipe_references CASCADE;

ALTER TABLE public.my_vehicles
  DROP COLUMN IF EXISTS fipe_value,
  DROP COLUMN IF EXISTS fipe_linked_at,
  DROP COLUMN IF EXISTS fipe_code,
  DROP COLUMN IF EXISTS fipe_reference_month,
  DROP COLUMN IF EXISTS fipe_status,
  DROP COLUMN IF EXISTS fipe_link_mode;

DELETE FROM public.app_settings WHERE key LIKE 'fipe%';