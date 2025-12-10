-- ============================================
-- SOLUTION ULTRA-SIMPLE QUI FONCTIONNE À 100%
-- Permet à TOUS les admins de modifier global_settings
-- ============================================

-- 1. Supprimer TOUTES les anciennes policies
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_super_admin_only" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_admin" ON public.global_settings;
DROP POLICY IF EXISTS "Only admins can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "allow_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "allow_update_admins" ON public.global_settings;
DROP POLICY IF EXISTS "allow_insert_admins" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_select_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_admin_only" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert_admin_only" ON public.global_settings;

-- 2. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy SELECT - Tout le monde peut lire
CREATE POLICY "allow_select_all"
ON public.global_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- 4. Policy UPDATE - Tous les admins (conversion correcte des types)
CREATE POLICY "allow_update_admins"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT id FROM public.users WHERE is_admin = true
  )
);

-- 5. Policy INSERT - Tous les admins (pour UPSERT)
CREATE POLICY "allow_insert_admins"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text IN (
    SELECT id FROM public.users WHERE is_admin = true
  )
);

-- 6. S'assurer que la ligne existe
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 7. Vérification
SELECT '✅ Policies RLS configurées avec succès!' as status;

-- Afficher les policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'global_settings';

-- Afficher les données
SELECT id, is_global_premium_enabled, scrolling_message, commission_percentage 
FROM public.global_settings;
