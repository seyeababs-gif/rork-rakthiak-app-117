-- ===================================================================
-- CORRECTION DÉFINITIVE : RLS pour permettre l'UPSERT au Super Admin
-- ===================================================================

-- 1. SUPPRIMER LES ANCIENNES POLICIES
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;

-- 2. RECRÉER LES POLICIES CORRECTES

-- Policy: Tout le monde peut LIRE
CREATE POLICY "global_settings_select_policy"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- Policy: Super Admin peut UPDATE
CREATE POLICY "global_settings_update_policy"
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

-- Policy: Super Admin peut INSERT (nécessaire pour UPSERT)
-- IMPORTANT: On autorise l'INSERT UNIQUEMENT pour l'ID fixe
CREATE POLICY "global_settings_insert_policy"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Seul le Super Admin peut insérer
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
  -- ET seulement l'ID fixe
  AND id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Policy: Bloquer les DELETE
CREATE POLICY "global_settings_delete_policy"
ON public.global_settings
FOR DELETE
TO public
USING (false);

-- 3. VÉRIFIER LA CONFIGURATION ACTUELLE
SELECT 
  id,
  is_global_premium_enabled AS premium,
  scrolling_message AS message,
  commission_percentage AS commission,
  updated_at,
  updated_by
FROM public.global_settings;

-- 4. TESTER SI VOUS ÊTES BIEN SUPER ADMIN
SELECT 
  id,
  name,
  email,
  is_super_admin,
  CASE 
    WHEN is_super_admin = true THEN '✅ Vous êtes Super Admin - Vous pouvez modifier les settings'
    ELSE '❌ PAS Super Admin - Exécutez cette commande: UPDATE users SET is_super_admin = true WHERE id = ''' || id || ''';'
  END AS status
FROM public.users
WHERE id = auth.uid()::text;

-- ===================================================================
-- INSTRUCTIONS POUR L'UTILISATION
-- ===================================================================
-- 
-- 1. Si vous n'êtes pas super admin, copiez la commande UPDATE ci-dessus et exécutez-la
-- 2. Ensuite, l'UPSERT dans l'app devrait fonctionner
-- 3. Le ScrollingText affichera le message configuré
-- 
-- Pour tester manuellement l'UPSERT depuis SQL:
-- 
-- INSERT INTO public.global_settings (
--   id,
--   is_global_premium_enabled,
--   scrolling_message,
--   commission_percentage,
--   updated_by
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001'::uuid,
--   true,
--   'Nouveau message de test',
--   15.0,
--   auth.uid()::text
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   is_global_premium_enabled = EXCLUDED.is_global_premium_enabled,
--   scrolling_message = EXCLUDED.scrolling_message,
--   commission_percentage = EXCLUDED.commission_percentage,
--   updated_by = EXCLUDED.updated_by,
--   updated_at = NOW();
-- 
-- SELECT * FROM public.global_settings;
-- 
-- ===================================================================
