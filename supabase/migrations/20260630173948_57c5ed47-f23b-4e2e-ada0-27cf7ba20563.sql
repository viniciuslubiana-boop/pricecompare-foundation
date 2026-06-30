
DROP POLICY IF EXISTS "Authenticated can insert acquisition logs" ON public.market_acquisition_logs;
CREATE POLICY "Authenticated can insert acquisition logs" ON public.market_acquisition_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert site discovery" ON public.site_discovery;
CREATE POLICY "Authenticated can insert site discovery" ON public.site_discovery FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert source history" ON public.market_source_history;
CREATE POLICY "Authenticated can insert source history" ON public.market_source_history FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "html_runs_insert_authenticated" ON public.html_intelligence_runs;
CREATE POLICY "html_runs_insert_authenticated" ON public.html_intelligence_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
