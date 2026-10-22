-- BALAM/CRUM SQLSTATE 42703: conservar exclusivamente la auditoria compatible.
-- Aplicado en Supabase BALAM el 22 de octubre de 2026.
-- No incluye inventario, coordenadas ni secretos.
BEGIN;
DO $guard$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_trigger
   WHERE tgrelid='public.balam_crum_assets'::regclass
   AND tgname='balam_crum_audit_changes'
   AND NOT tgisinternal AND tgenabled <> 'D'
 ) THEN
   RAISE EXCEPTION 'Auditoria principal inexistente: no se modificaron triggers';
 END IF;
END $guard$;
DROP TRIGGER IF EXISTS balam_crum_version_on_insert ON public.balam_crum_assets;
DROP TRIGGER IF EXISTS balam_crum_version_on_update ON public.balam_crum_assets;
DROP FUNCTION IF EXISTS public.balam_crum_record_version();
DROP POLICY IF EXISTS balam_crum_assets_scoped_read ON public.balam_crum_assets;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.balam_crum_assets TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.balam_crum_imports TO authenticated;
GRANT SELECT ON public.balam_crum_asset_versions TO authenticated;
REVOKE ALL ON public.balam_crum_assets,public.balam_crum_imports,public.balam_crum_asset_versions FROM anon;
COMMIT;
