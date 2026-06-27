
DROP POLICY IF EXISTS my_vehicles_delete_admin ON public.my_vehicles;
CREATE POLICY my_vehicles_delete_mgr ON public.my_vehicles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

DROP POLICY IF EXISTS competitors_delete_admin ON public.competitors;
CREATE POLICY competitors_delete_mgr ON public.competitors FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

DROP POLICY IF EXISTS competitor_vehicles_delete_admin ON public.competitor_vehicles;
CREATE POLICY competitor_vehicles_delete_mgr ON public.competitor_vehicles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));

DROP POLICY IF EXISTS extraction_logs_delete_admin ON public.extraction_logs;
CREATE POLICY extraction_logs_delete_mgr ON public.extraction_logs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gerente'::app_role));
