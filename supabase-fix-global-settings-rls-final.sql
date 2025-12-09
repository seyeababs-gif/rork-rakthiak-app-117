-- ===================================================================
-- CORRECTION FINALE : RLS qui autorise UPSERT pour le Super Admin
-- ===================================================================

-- 1. SUPPRIMER TOUTES LES ANCIENNES POLICIES
DROP POLICY IF EXISTS "global_settings_select_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_delete_policy" ON public.global_settings;
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;

-- 2. RECRÉER LES POLICIES CORRECTEMENT

-- Lecture publique (tout le monde peut lire)
CREATE POLICY "global_settings_read"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- Insertion uniquement pour Super Admin et uniquement pour l'ID fixe
CREATE POLICY "global_settings_insert"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  id = '00000000-0000-0000-0000-000000000001'::uuid
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
);

-- Mise à jour uniquement pour Super Admin
CREATE POLICY "global_settings_update"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
);

-- Bloquer la suppression (personne ne peut supprimer)
CREATE POLICY "global_settings_no_delete"
ON public.global_settings
FOR DELETE
TO public
USING (false);

-- 3. S'ASSURER QUE LA LIGNE EXISTE
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  false,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. VÉRIFICATION : Afficher la configuration actuelle
SELECT 
  '📋 Configuration actuelle:' AS info,
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_at,
  updated_by
FROM public.global_settings;

-- 5. VÉRIFICATION : Statut Super Admin
SELECT 
  '👤 Votre statut:' AS info,
  id,
  name,
  email,
  is_super_admin,
  CASE 
    WHEN is_super_admin = true 
    THEN '✅ SUPER ADMIN - Vous pouvez modifier les paramètres globaux'
    ELSE '❌ NON SUPER ADMIN - Exécutez: UPDATE users SET is_super_admin = true WHERE id = ''' || id || ''';'
  END AS status
FROM public.users
WHERE id = auth.uid()::text;

-- ===================================================================
-- TEST MANUEL (À exécuter après avoir vérifié que vous êtes super admin)
-- ===================================================================
-- 
-- UPDATE public.global_settings
-- SET 
--   scrolling_message = 'Test du message défilant doré',
--   commission_percentage = 12.5,
--   is_global_premium_enabled = true,
--   updated_by = auth.uid()::text,
--   updated_at = NOW()
-- WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
-- 
-- SELECT * FROM public.global_settings;
-- 
-- ===================================================================
