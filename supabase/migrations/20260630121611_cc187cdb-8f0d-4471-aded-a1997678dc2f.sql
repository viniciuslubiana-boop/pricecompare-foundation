
DROP POLICY IF EXISTS "auth update scores" ON public.market_source_scores;
DROP POLICY IF EXISTS "auth insert scores" ON public.market_source_scores;

CREATE POLICY "auth insert scores" ON public.market_source_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin update scores" ON public.market_source_scores
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
