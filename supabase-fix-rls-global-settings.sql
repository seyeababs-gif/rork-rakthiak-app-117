-- ===================================================================
-- CORRECTION DÉFINITIVE : RLS pour global_settings
-- ===================================================================

-- 1. DÉSACTIVER RLS TEMPORAIREMENT
ALTER TABLE public.global_settings DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES ANCIENNES POLICIES
DROP POLICY IF EXISTS "global_settings_select_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert_policy" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_delete_policy" ON public.global_settings;
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_no_delete" ON public.global_settings;

-- 3. S'ASSURER QUE LA LIGNE EXISTE AVEC L'ID FIXE
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
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 4. RÉACTIVER RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. CRÉER LES NOUVELLES POLICIES

-- Lecture publique (tout le monde peut lire)
CREATE POLICY "global_settings_read_all"
ON public.global_settings
FOR SELECT
USING (true);

-- Mise à jour et insertion uniquement pour Super Admin
-- On utilise une seule policy pour INSERT et UPDATE
CREATE POLICY "global_settings_modify_super_admin"
ON public.global_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  id = '00000000-0000-0000-0000-000000000001'::uuid
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
);

-- 6. VÉRIFICATIONS
SELECT 
  '📋 Configuration actuelle:' AS info,
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_at,
  updated_by
FROM public.global_settings;

SELECT 
  '👤 Votre statut:' AS info,
  id,
  name,
  email,
  is_super_admin,
  CASE 
    WHEN is_super_admin = true 
    THEN '✅ SUPER ADMIN - Vous pouvez modifier les paramètres'
    ELSE '❌ NON SUPER ADMIN - Connectez-vous avec le compte super admin'
  END AS status
FROM public.users
WHERE id = auth.uid()::text;

-- ===================================================================
-- IMPORTANT : Si vous avez encore l'erreur 42501:
-- 1. Vérifiez que vous êtes bien connecté avec le compte super admin
-- 2. Exécutez cette requête pour donner les droits super admin:
--    UPDATE users SET is_super_admin = true WHERE email = 'votre_email@example.com';
-- ===================================================================
