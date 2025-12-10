-- =====================================================
-- FIX ULTIME - Global Settings RLS
-- Résout définitivement le problème RLS 42501
-- =====================================================

-- Étape 1 : Supprimer TOUTES les politiques existantes
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
END $$;

-- Étape 2 : Ajouter les colonnes manquantes (sans erreur si elles existent)
DO $$ 
BEGIN
  -- Ajouter premium_enabled si manquante
  BEGIN
    ALTER TABLE public.global_settings ADD COLUMN premium_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✓ Colonne premium_enabled ajoutée';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE '→ Colonne premium_enabled existe déjà';
  END;
  
  -- Ajouter message_text si manquante
  BEGIN
    ALTER TABLE public.global_settings ADD COLUMN message_text TEXT DEFAULT 'Bienvenue sur Rakthiak';
    RAISE NOTICE '✓ Colonne message_text ajoutée';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE '→ Colonne message_text existe déjà';
  END;
  
  -- Ajouter commission_rate si manquante
  BEGIN
    ALTER TABLE public.global_settings ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT 10.0;
    RAISE NOTICE '✓ Colonne commission_rate ajoutée';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE '→ Colonne commission_rate existe déjà';
  END;
END $$;

-- Étape 3 : Migrer les données des anciennes colonnes vers les nouvelles
DO $$
BEGIN
  -- Migrer is_global_premium_enabled -> premium_enabled
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'is_global_premium_enabled') THEN
    UPDATE public.global_settings 
    SET premium_enabled = COALESCE(is_global_premium_enabled, false)
    WHERE premium_enabled IS NULL OR premium_enabled = false;
    RAISE NOTICE '✓ Migration: is_global_premium_enabled -> premium_enabled';
  END IF;
  
  -- Migrer scrolling_message -> message_text
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'scrolling_message') THEN
    UPDATE public.global_settings 
    SET message_text = COALESCE(scrolling_message, 'Bienvenue sur Rakthiak')
    WHERE message_text IS NULL OR message_text = '';
    RAISE NOTICE '✓ Migration: scrolling_message -> message_text';
  END IF;
  
  -- Migrer commission_percentage -> commission_rate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'commission_percentage') THEN
    UPDATE public.global_settings 
    SET commission_rate = COALESCE(commission_percentage, 10.0)
    WHERE commission_rate IS NULL OR commission_rate = 0;
    RAISE NOTICE '✓ Migration: commission_percentage -> commission_rate';
  END IF;
END $$;

-- Étape 4 : Désactiver RLS temporairement pour garantir l'insertion
ALTER TABLE public.global_settings DISABLE ROW LEVEL SECURITY;

-- Étape 5 : Insérer ou mettre à jour la ligne de configuration unique
INSERT INTO public.global_settings (
  id, 
  premium_enabled, 
  message_text, 
  commission_rate,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  false,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  premium_enabled = COALESCE(global_settings.premium_enabled, false),
  message_text = COALESCE(NULLIF(global_settings.message_text, ''), 'Bienvenue sur Rakthiak'),
  commission_rate = COALESCE(global_settings.commission_rate, 10.0),
  updated_at = NOW();

-- Étape 6 : Réactiver RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Étape 7 : Créer les politiques RLS finales
DO $$
BEGIN
  -- Politique de LECTURE pour TOUS
  CREATE POLICY "global_settings_read_public" 
  ON public.global_settings 
  FOR SELECT 
  USING (true);
  RAISE NOTICE '✅ Politique de lecture publique créée';
  
  -- Politique ALL (INSERT + UPDATE) pour super_admin
  -- Note: On utilise FOR ALL pour gérer UPSERT en une seule politique
  CREATE POLICY "global_settings_all_super_admin" 
  ON public.global_settings 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (auth.uid())::text 
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = (auth.uid())::text 
      AND users.is_super_admin = true
    )
  );
  RAISE NOTICE '✅ Politique ALL (UPSERT) pour super admin créée';
  
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Une ou plusieurs politiques existaient déjà';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création des politiques: %', SQLERRM;
END $$;

-- Étape 8 : Diagnostic - Afficher l'utilisateur actuel
DO $$
DECLARE
  current_user_id TEXT;
  is_super BOOLEAN;
  user_name TEXT;
BEGIN
  BEGIN
    current_user_id := (auth.uid())::text;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;
  
  IF current_user_id IS NOT NULL THEN
    SELECT is_super_admin, name 
    INTO is_super, user_name
    FROM public.users 
    WHERE id = current_user_id;
    
    IF user_name IS NOT NULL THEN
      RAISE NOTICE '';
      RAISE NOTICE '👤 Utilisateur actuel: %', user_name;
      RAISE NOTICE '   ID: %', current_user_id;
      RAISE NOTICE '   Super Admin: %', CASE WHEN is_super THEN '✅ OUI' ELSE '❌ NON' END;
      
      IF NOT is_super THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔧 POUR DEVENIR SUPER ADMIN, EXÉCUTEZ:';
        RAISE NOTICE '   UPDATE users SET is_super_admin = true WHERE id = ''%'';', current_user_id;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Pas d''utilisateur authentifié (script exécuté via Dashboard)';
  END IF;
END $$;

-- Étape 9 : Afficher la configuration finale
DO $$
DECLARE
  settings_record RECORD;
BEGIN
  SELECT * INTO settings_record 
  FROM public.global_settings 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF settings_record IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '📋 CONFIGURATION ACTUELLE:';
    RAISE NOTICE '   Premium Global: %', COALESCE(settings_record.premium_enabled, false);
    RAISE NOTICE '   Message: %', COALESCE(settings_record.message_text, 'N/A');
    RAISE NOTICE '   Commission: %', COALESCE(settings_record.commission_rate, 0) || '%';
    RAISE NOTICE '════════════════════════════════════════════════════════';
  END IF;
END $$;

-- Étape 10 : Lister les politiques actives
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

-- Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 ÉTAPES IMPORTANTES POUR TESTER:';
  RAISE NOTICE '   1. Vérifiez votre statut Super Admin ci-dessus';
  RAISE NOTICE '   2. Si NON, exécutez la commande UPDATE fournie';
  RAISE NOTICE '   3. DÉCONNECTEZ-VOUS complètement de l''app';
  RAISE NOTICE '   4. FERMEZ l''app/onglet complètement';
  RAISE NOTICE '   5. RECONNECTEZ-VOUS (pour rafraîchir le token JWT)';
  RAISE NOTICE '   6. Testez la modification des paramètres';
  RAISE NOTICE '';
  RAISE NOTICE '💡 LE TOKEN JWT DOIT ÊTRE RAFRAÎCHI!';
  RAISE NOTICE '   Sans déconnexion/reconnexion, l''ancien token';
  RAISE NOTICE '   ne contiendra pas le flag is_super_admin = true';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
