DROP POLICY IF EXISTS import_logs_delete_own ON public.import_logs;
CREATE POLICY import_logs_delete_mgr ON public.import_logs
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));