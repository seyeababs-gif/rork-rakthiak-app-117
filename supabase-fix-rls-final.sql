-- =====================================================
-- SCRIPT FINAL DE CORRECTION RLS POUR GLOBAL_SETTINGS
-- =====================================================
-- Ce script nettoie et reconfigure les politiques RLS
-- pour permettre UPSERT uniquement au super_admin
-- =====================================================

-- Étape 1 : Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Allow all read global_settings" ON global_settings;
DROP POLICY IF EXISTS "Allow super admin update global_settings" ON global_settings;
DROP POLICY IF EXISTS "Allow super admin upsert global_settings" ON global_settings;
DROP POLICY IF EXISTS "global_settings_select_policy" ON global_settings;
DROP POLICY IF EXISTS "global_settings_update_policy" ON global_settings;
DROP POLICY IF EXISTS "global_settings_upsert_policy" ON global_settings;

-- Étape 2 : Assurer que la table existe et est correctement configurée
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  is_global_premium_enabled BOOLEAN DEFAULT false,
  scrolling_message TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  commission_percentage DECIMAL(5,2) DEFAULT 10.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Étape 3 : Activer RLS sur la table
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Étape 4 : Vérifier et insérer la ligne de configuration unique si elle n'existe pas
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

-- Étape 5 : Créer les nouvelles politiques RLS

-- Politique de lecture : tout le monde peut lire (authentifié ou non)
CREATE POLICY "global_settings_read_all" 
ON global_settings 
FOR SELECT 
USING (true);

-- Politique d'UPDATE : SEUL le super_admin peut modifier
CREATE POLICY "global_settings_update_super_admin_only" 
ON global_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  )
);

-- Politique d'INSERT : SEUL le super_admin peut insérer (pour l'UPSERT)
CREATE POLICY "global_settings_insert_super_admin_only" 
ON global_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  )
);

-- Étape 6 : Vérification - Afficher l'utilisateur actuel et son statut super_admin
DO $$
DECLARE
  current_user_id UUID;
  is_super BOOLEAN;
  user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️  Aucun utilisateur connecté (auth.uid() = NULL)';
  ELSE
    SELECT is_super_admin, email 
    INTO is_super, user_email
    FROM users 
    WHERE id = current_user_id;
    
    IF is_super THEN
      RAISE NOTICE '✅ Utilisateur actuel: % (%) - SUPER ADMIN', user_email, current_user_id;
    ELSE
      RAISE NOTICE '❌ Utilisateur actuel: % (%) - PAS SUPER ADMIN', user_email, current_user_id;
    END IF;
  END IF;
END $$;

-- Étape 7 : Afficher les paramètres actuels
DO $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record FROM global_settings LIMIT 1;
  
  IF settings_record IS NOT NULL THEN
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ CONFIGURATION GLOBALE ACTUELLE:';
    RAISE NOTICE '   - Premium Global: %', settings_record.is_global_premium_enabled;
    RAISE NOTICE '   - Message: %', settings_record.scrolling_message;
    RAISE NOTICE '   - Commission: %', settings_record.commission_percentage || '%';
    RAISE NOTICE '   - Dernière mise à jour: %', settings_record.updated_at;
    RAISE NOTICE '════════════════════════════════════════════════════════';
  ELSE
    RAISE NOTICE '⚠️  Aucune configuration trouvée';
  END IF;
END $$;

-- Étape 8 : Instructions finales
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SCRIPT TERMINÉ AVEC SUCCÈS!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CE QUI A ÉTÉ FAIT:';
  RAISE NOTICE '   ✓ Nettoyage des anciennes politiques RLS';
  RAISE NOTICE '   ✓ Création de la table global_settings (si nécessaire)';
  RAISE NOTICE '   ✓ Insertion de la ligne de configuration unique';
  RAISE NOTICE '   ✓ Création des politiques RLS (READ, UPDATE, INSERT)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 POLITIQUES RLS ACTIVES:';
  RAISE NOTICE '   → Lecture (SELECT): Tout le monde';
  RAISE NOTICE '   → Modification (UPDATE): Super Admin uniquement';
  RAISE NOTICE '   → Insertion (INSERT): Super Admin uniquement';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SI VOUS AVEZ ENCORE DES ERREURS:';
  RAISE NOTICE '   1. Vérifiez que votre utilisateur a is_super_admin = true';
  RAISE NOTICE '   2. Déconnectez-vous et reconnectez-vous dans l''app';
  RAISE NOTICE '   3. Vérifiez les logs ci-dessus pour confirmer votre statut';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
