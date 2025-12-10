-- ✅ SOLUTION SIMPLE ET QUI MARCHE À COUP SÛR
-- Donne les droits à TOUS les admins (is_admin = true)

-- 1. Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_super_admin_only" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_admin" ON public.global_settings;
DROP POLICY IF EXISTS "Only admins can update global settings" ON public.global_settings;

-- 2. S'assurer que RLS est activé
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 3. Créer des politiques SIMPLES
-- Tout le monde peut lire
CREATE POLICY "allow_read_all"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- Tous les ADMINS peuvent modifier (is_admin = true)
CREATE POLICY "allow_update_admins"
ON public.global_settings
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_admin = true
  )
);

-- Tous les ADMINS peuvent faire des UPSERT
CREATE POLICY "allow_insert_admins"
ON public.global_settings
FOR INSERT
TO public
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

-- 5. Vérifier
SELECT 'Configuration OK!' as status;
SELECT * FROM public.global_settings;
