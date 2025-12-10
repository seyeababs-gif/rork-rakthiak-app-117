-- FIX FINAL POUR GLOBAL SETTINGS
-- Ce script corrige définitivement les permissions pour les paramètres globaux

-- 1. Vérifier la structure de la table users
DO $$
BEGIN
  -- Ajouter is_super_admin si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Colonne is_super_admin ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne is_super_admin existe déjà';
  END IF;
END $$;

-- 2. Vérifier la structure de la table global_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'global_settings'
  ) THEN
    CREATE TABLE public.global_settings (
      id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
      is_global_premium_enabled BOOLEAN DEFAULT false,
      scrolling_message TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
      commission_percentage NUMERIC DEFAULT 10.0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE '✅ Table global_settings créée';
  ELSE
    RAISE NOTICE '✅ Table global_settings existe déjà';
  END IF;
END $$;

-- 3. Insérer l'enregistrement unique si non présent
INSERT INTO public.global_settings (id, is_global_premium_enabled, scrolling_message, commission_percentage)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  false,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0
)
ON CONFLICT (id) DO NOTHING;

-- 4. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "read_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "update_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "upsert_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "insert_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_insert" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_upsert" ON public.global_settings;
DROP POLICY IF EXISTS "allow_read_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "allow_update_global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "allow_insert_global_settings" ON public.global_settings;

-- 6. Créer les nouvelles policies simples et efficaces

-- LECTURE : Tout le monde peut lire (même non authentifié)
CREATE POLICY "read_global_settings"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- UPDATE : Tous les admins peuvent modifier
CREATE POLICY "update_global_settings"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_admin = true
  )
);

-- INSERT : Tous les admins peuvent insérer (pour UPSERT)
CREATE POLICY "insert_global_settings"
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

-- 7. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = true;

-- 8. Afficher un diagnostic
DO $$
DECLARE
  current_user_id text;
  current_user_name text;
  is_user_admin boolean;
BEGIN
  current_user_id := auth.uid()::text;
  
  IF current_user_id IS NOT NULL THEN
    SELECT name, is_admin INTO current_user_name, is_user_admin
    FROM public.users
    WHERE id = current_user_id;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📊 DIAGNOSTIC UTILISATEUR ACTUEL';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'ID: %', current_user_id;
    RAISE NOTICE 'Nom: %', COALESCE(current_user_name, 'NON TROUVÉ');
    RAISE NOTICE 'Est admin: %', COALESCE(is_user_admin::text, 'NON TROUVÉ');
    
    IF NOT COALESCE(is_user_admin, false) THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  VOUS N''ÊTES PAS ADMIN !';
      RAISE NOTICE '📝 Pour devenir admin, exécutez:';
      RAISE NOTICE '   UPDATE public.users SET is_admin = true WHERE id = ''%'';', current_user_id;
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '✅ Vous êtes admin - Vous pouvez modifier les paramètres globaux';
    END IF;
  ELSE
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '⚠️  AUCUN UTILISATEUR CONNECTÉ';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Connectez-vous d''abord pour modifier les paramètres';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- 9. Afficher la liste des admins
SELECT 
  '🔐 LISTE DES ADMINISTRATEURS' as info,
  id,
  name,
  email,
  phone,
  is_admin,
  is_super_admin
FROM public.users
WHERE is_admin = true
ORDER BY created_at;

-- 10. Afficher les paramètres actuels
SELECT 
  '⚙️  PARAMÈTRES GLOBAUX ACTUELS' as info,
  id,
  is_global_premium_enabled as "Premium activé",
  scrolling_message as "Message défilant",
  commission_percentage as "Commission %",
  updated_at as "Dernière mise à jour"
FROM public.global_settings;

RAISE NOTICE '';
RAISE NOTICE '✅ Configuration terminée avec succès !';
RAISE NOTICE '';
RAISE NOTICE '📌 RÉSUMÉ:';
RAISE NOTICE '  - Tout le monde peut LIRE les paramètres';
RAISE NOTICE '  - Seuls les utilisateurs avec is_admin = true peuvent MODIFIER';
RAISE NOTICE '  - Les UPSERT fonctionnent correctement';
RAISE NOTICE '';
