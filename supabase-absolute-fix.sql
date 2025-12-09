-- =====================================================
-- FIX ABSOLU ET DÉFINITIF - Global Settings RLS
-- Version Expert Backend qui règle TOUS les problèmes
-- =====================================================

-- Étape 1 : Supprimer TOUTES les politiques existantes (sans erreur si elles n'existent pas)
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '🗑️  Suppression de toutes les politiques existantes...';
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'global_settings' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON global_settings', policy_record.policyname);
    RAISE NOTICE '   ✓ Politique supprimée: %', policy_record.policyname;
  END LOOP;
  RAISE NOTICE '✅ Toutes les politiques ont été supprimées';
END $$;

-- Étape 2 : S'assurer que la table existe avec la bonne structure
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  is_global_premium_enabled BOOLEAN DEFAULT false,
  scrolling_message TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  commission_percentage DECIMAL(5,2) DEFAULT 10.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Étape 3 : Désactiver temporairement RLS pour insertion
ALTER TABLE global_settings DISABLE ROW LEVEL SECURITY;

-- Étape 4 : Insérer la ligne de configuration unique si elle n'existe pas
INSERT INTO global_settings (
  id, 
  is_global_premium_enabled, 
  scrolling_message, 
  commission_percentage,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  false,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Étape 5 : Réactiver RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Étape 6 : Créer les politiques RLS (version blindée avec gestion d'erreurs)
DO $$
BEGIN
  -- Politique de LECTURE pour TOUS (anonymes et connectés)
  BEGIN
    CREATE POLICY "global_settings_read_all" 
    ON global_settings 
    FOR SELECT 
    USING (true);
    RAISE NOTICE '✅ Politique de lecture créée';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Politique de lecture existe déjà';
  END;
  
  -- Politique UPDATE pour super_admin SEULEMENT
  -- Note: auth.uid() retourne UUID mais users.id est TEXT, donc on cast
  BEGIN
    CREATE POLICY "global_settings_update_super_admin" 
    ON global_settings 
    FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = (auth.uid())::text 
        AND users.is_super_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = (auth.uid())::text 
        AND users.is_super_admin = true
      )
    );
    RAISE NOTICE '✅ Politique UPDATE créée';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Politique UPDATE existe déjà';
  END;
  
  -- Politique INSERT pour super_admin (nécessaire pour UPSERT)
  BEGIN
    CREATE POLICY "global_settings_insert_super_admin" 
    ON global_settings 
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = (auth.uid())::text 
        AND users.is_super_admin = true
      )
    );
    RAISE NOTICE '✅ Politique INSERT créée';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Politique INSERT existe déjà';
  END;
END $$;

-- Étape 7 : Vérification de l'utilisateur actuel
DO $$
DECLARE
  current_user_id TEXT;
  is_super BOOLEAN;
  user_name TEXT;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté (cast UUID vers TEXT)
  BEGIN
    current_user_id := (auth.uid())::text;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ATTENTION: Aucun utilisateur connecté';
    RAISE NOTICE '   Ce script doit être exécuté depuis Supabase Dashboard';
    RAISE NOTICE '   Les modifications dans l''app nécessitent un Super Admin';
  ELSE
    SELECT is_super_admin, name 
    INTO is_super, user_name
    FROM users 
    WHERE id = current_user_id;
    
    IF user_name IS NULL THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  ATTENTION: Utilisateur non trouvé dans la table users';
      RAISE NOTICE '   ID recherché: %', current_user_id;
      RAISE NOTICE '   Cet utilisateur n''existe pas dans votre base de données';
    ELSIF is_super THEN
      RAISE NOTICE '';
      RAISE NOTICE '✅ Utilisateur: % - SUPER ADMIN ✓', user_name;
      RAISE NOTICE '   ID: %', current_user_id;
      RAISE NOTICE '   Vous POUVEZ modifier les paramètres globaux';
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '❌ Utilisateur: % - PAS SUPER ADMIN', user_name;
      RAISE NOTICE '   ID: %', current_user_id;
      RAISE NOTICE '   Vous NE POUVEZ PAS modifier les paramètres globaux';
      RAISE NOTICE '';
      RAISE NOTICE '🔧 POUR DEVENIR SUPER ADMIN:';
      RAISE NOTICE '   UPDATE users SET is_super_admin = true WHERE id = ''%'';', current_user_id;
    END IF;
  END IF;
END $$;

-- Étape 8 : Afficher la configuration actuelle
DO $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record 
  FROM global_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF settings_record IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '📋 CONFIGURATION GLOBALE ACTUELLE:';
    RAISE NOTICE '   ID: %', settings_record.id;
    RAISE NOTICE '   Premium Global: %', settings_record.is_global_premium_enabled;
    RAISE NOTICE '   Message: %', settings_record.scrolling_message;
    RAISE NOTICE '   Commission: %', settings_record.commission_percentage || '%';
    RAISE NOTICE '   Dernière mise à jour: %', settings_record.updated_at;
    IF settings_record.updated_by IS NOT NULL THEN
      RAISE NOTICE '   Modifié par: %', settings_record.updated_by;
    END IF;
    RAISE NOTICE '════════════════════════════════════════════════════════';
  END IF;
END $$;

-- Étape 9 : Afficher les politiques actives
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 POLITIQUES RLS ACTIVES:';
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'global_settings' 
    AND schemaname = 'public'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   → %: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
END $$;

-- Étape 10 : Instructions finales
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SCRIPT TERMINÉ AVEC SUCCÈS!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CE QUI A ÉTÉ FAIT:';
  RAISE NOTICE '   ✓ Suppression de toutes les anciennes politiques';
  RAISE NOTICE '   ✓ Création/vérification de la ligne de configuration';
  RAISE NOTICE '   ✓ Politiques RLS créées avec casting TEXT/UUID correct';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 RÈGLES DE SÉCURITÉ:';
  RAISE NOTICE '   → SELECT: Tout le monde peut lire (même anonymes)';
  RAISE NOTICE '   → UPDATE: Super Admin uniquement';
  RAISE NOTICE '   → INSERT: Super Admin uniquement (pour UPSERT)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ÉTAPES IMPORTANTES:';
  RAISE NOTICE '   1. Trouvez votre ID utilisateur dans l''app (logs console)';
  RAISE NOTICE '   2. Si vous n''êtes pas Super Admin, exécutez:';
  RAISE NOTICE '      UPDATE users SET is_super_admin = true WHERE id = ''VOTRE_ID'';';
  RAISE NOTICE '   3. Déconnectez-vous COMPLÈTEMENT de l''app';
  RAISE NOTICE '   4. Reconnectez-vous (pour rafraîchir le token)';
  RAISE NOTICE '   5. Testez la modification des paramètres';
  RAISE NOTICE '';
  RAISE NOTICE '💡 COMMENT TROUVER VOTRE ID:';
  RAISE NOTICE '   → Dans l''app, allez sur votre Profil';
  RAISE NOTICE '   → Ouvrez la console développeur (F12)';
  RAISE NOTICE '   → Cherchez "[GLOBAL SETTINGS] Current user:"';
  RAISE NOTICE '   → Le premier paramètre est votre ID';
  RAISE NOTICE '';
  RAISE NOTICE '🐛 SI ÇA NE MARCHE TOUJOURS PAS:';
  RAISE NOTICE '   → Vérifiez que vous êtes bien connecté';
  RAISE NOTICE '   → Vérifiez que is_super_admin = true dans votre profil';
  RAISE NOTICE '   → Déconnectez-vous ET FERMEZ l''app avant de vous reconnecter';
  RAISE NOTICE '   → Vérifiez les logs console pour voir l''ID utilisé';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
