CREATE POLICY "import_logs_delete_own"
ON public.import_logs
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "import_logs_delete_admin" ON public.import_logs;