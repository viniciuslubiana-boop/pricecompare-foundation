DROP POLICY IF EXISTS "auth insert own logs" ON public.api_integration_logs;
CREATE POLICY "auth insert own logs"
  ON public.api_integration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);