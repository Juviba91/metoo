-- Regresión introducida en `20260907_cerrar_agujeros_rls.sql`: al reescribir
-- `conn_update` puse `auth.uid()` a pelo, y todas las demás políticas del
-- proyecto usan `(select auth.uid())`.
--
-- No es cosmético. Sin el SELECT, Postgres trata la llamada como volátil y la
-- evalúa UNA VEZ POR FILA examinada en vez de una vez por consulta. Con dos
-- conexiones no se nota; es justo el tipo de cosa que aparece cuando ya hay
-- tráfico y cuesta relacionarla con su causa.
--
-- El linter de Supabase lo marca como `auth_rls_initplan`.

ALTER POLICY conn_update ON public.connections
  USING ((select auth.uid()) = volunteer_id)
  WITH CHECK ((select auth.uid()) = volunteer_id);
