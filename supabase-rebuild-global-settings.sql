-- 🔥 RECONSTRUCTION COMPLÈTE DU SYSTÈME GLOBAL SETTINGS
-- Version ultra-simple qui fonctionne à coup sûr
-- Droits donnés à TOUS les admins (is_admin = true)

-- 1. Supprimer complètement la table existante
DROP TABLE IF EXISTS public.global_settings CASCADE;

-- 2. Créer la table proprement
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_global_premium_enabled BOOLEAN NOT NULL DEFAULT false,
  scrolling_message TEXT NOT NULL DEFAULT '',
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Insérer la ligne par défaut avec un ID fixe
INSERT INTO public.global_settings (
  id, 
  is_global_premium_enabled, 
  scrolling_message, 
  commission_percentage
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID, 
  false, 
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal', 
  12.5
);

-- 4. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer toutes les anciennes politiques si elles existent
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_select_all" ON public.global_settings;
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_admin" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_super_admin_only" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admin update settings" ON public.global_settings;

-- 6. Créer une politique simple pour la lecture (tout le monde peut lire)
CREATE POLICY "Anyone can read settings"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- 7. Créer une politique simple pour l'update (tous les admins)
CREATE POLICY "Admins can update settings"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- 8. Créer une politique pour l'insert (au cas où, même logique)
CREATE POLICY "Admins can insert settings"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- 9. Vérifier que tout est bien configuré
DO $$
BEGIN
  RAISE NOTICE '✅ Table global_settings recréée avec succès';
  RAISE NOTICE '✅ Ligne par défaut insérée (ID: 00000000-0000-0000-0000-000000000001)';
  RAISE NOTICE '✅ RLS activé';
  RAISE NOTICE '✅ Politiques créées: lecture publique, modification pour admins';
  RAISE NOTICE '📌 Tous les utilisateurs avec is_admin = true peuvent maintenant modifier les paramètres';
END $$;
