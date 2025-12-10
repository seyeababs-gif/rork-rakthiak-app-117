-- ============================================
-- SOLUTION DÉFINITIVE QUI MARCHE
-- Donne les droits à TOUS les admins (is_admin = true)
-- ============================================

-- 1. Supprimer TOUTES les anciennes politiques
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

-- 2. S'assurer que RLS est activé
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques SIMPLES qui FONCTIONNENT
-- Tout le monde peut lire
CREATE POLICY "global_settings_select_all"
ON public.global_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Tous les ADMINS peuvent UPDATE (auth.uid() converti en TEXT)
CREATE POLICY "global_settings_update_admin_only"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_admin = true
  )
);

-- Tous les ADMINS peuvent INSERT (pour le UPSERT)
CREATE POLICY "global_settings_insert_admin_only"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_admin = true
  )
);

-- 4. S'assurer que la ligne existe
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0
)
ON CONFLICT (id) DO NOTHING;

-- 5. Vérification finale
SELECT '✅ Configuration RLS terminée avec succès!' as status;
SELECT id, is_global_premium_enabled, scrolling_message, commission_percentage FROM public.global_settings;
