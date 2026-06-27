
DROP POLICY IF EXISTS "Authenticated insert market changes" ON public.market_changes;
CREATE POLICY "Authenticated insert market changes"
  ON public.market_changes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
