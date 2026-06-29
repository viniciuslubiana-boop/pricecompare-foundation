CREATE TABLE public.user_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  base_company_id uuid REFERENCES public.base_companies(id) ON DELETE SET NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  favorites jsonb NOT NULL DEFAULT '[]'::jsonb,
  collapsed jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_dashboard_preferences TO authenticated;
GRANT ALL ON public.user_dashboard_preferences TO service_role;

ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_dashboard_prefs"
  ON public.user_dashboard_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_dashboard_prefs"
  ON public.user_dashboard_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_dashboard_prefs"
  ON public.user_dashboard_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_dashboard_prefs"
  ON public.user_dashboard_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.user_dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();