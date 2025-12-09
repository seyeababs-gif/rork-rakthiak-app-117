-- =====================================================
-- SCRIPT DE DIAGNOSTIC - Global Settings RLS
-- Exécutez ce script pour identifier le problème
-- =====================================================

DO $$
DECLARE
  current_user_id TEXT;
  is_super BOOLEAN;
  user_name TEXT;
  settings_count INTEGER;
  policies_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 DIAGNOSTIC DES PARAMÈTRES GLOBAUX';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Test 1 : Utilisateur connecté ?
  current_user_id := auth.uid()::text;
  IF current_user_id IS NULL THEN
    RAISE NOTICE '❌ TEST 1 : AUCUN UTILISATEUR CONNECTÉ';
    RAISE NOTICE '   → Vous devez être connecté dans votre app';
    RAISE NOTICE '   → auth.uid() retourne NULL';
  ELSE
    RAISE NOTICE '✅ TEST 1 : Utilisateur connecté';
    RAISE NOTICE '   → ID: %', current_user_id;
    
    -- Test 2 : Utilisateur existe dans la table users ?
    SELECT is_super_admin, name 
    INTO is_super, user_name
    FROM users 
    WHERE id = current_user_id;
    
    IF user_name IS NULL THEN
      RAISE NOTICE '❌ TEST 2 : UTILISATEUR NON TROUVÉ DANS LA TABLE USERS';
      RAISE NOTICE '   → L''utilisateur % n''existe pas dans users', current_user_id;
    ELSE
      RAISE NOTICE '✅ TEST 2 : Utilisateur trouvé';
      RAISE NOTICE '   → Nom: %', user_name;
      
      -- Test 3 : L'utilisateur est Super Admin ?
      IF is_super THEN
        RAISE NOTICE '✅ TEST 3 : Vous êtes SUPER ADMIN';
        RAISE NOTICE '   → Vous avez les droits pour modifier les paramètres';
      ELSE
        RAISE NOTICE '❌ TEST 3 : VOUS N''ÊTES PAS SUPER ADMIN';
        RAISE NOTICE '   → C''est probablement la cause du problème !';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUTION : Exécutez cette commande :';
        RAISE NOTICE '   UPDATE users SET is_super_admin = true WHERE id = ''%'';', current_user_id;
      END IF;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  
  -- Test 4 : La table global_settings existe ?
  SELECT COUNT(*) INTO settings_count FROM global_settings;
  IF settings_count = 0 THEN
    RAISE NOTICE '❌ TEST 4 : AUCUNE LIGNE DANS global_settings';
    RAISE NOTICE '   → Exécutez le script supabase-fix-rls-ultimate.sql';
  ELSIF settings_count = 1 THEN
    RAISE NOTICE '✅ TEST 4 : Ligne de configuration trouvée';
    RAISE NOTICE '   → Nombre de lignes: %', settings_count;
  ELSE
    RAISE NOTICE '⚠️  TEST 4 : PLUSIEURS LIGNES DANS global_settings';
    RAISE NOTICE '   → Il devrait y avoir une seule ligne !';
    RAISE NOTICE '   → Nombre de lignes: %', settings_count;
  END IF;
  
  -- Test 5 : Les politiques RLS sont configurées ?
  SELECT COUNT(*) INTO policies_count 
  FROM pg_policies 
  WHERE tablename = 'global_settings' AND schemaname = 'public';
  
  IF policies_count = 0 THEN
    RAISE NOTICE '❌ TEST 5 : AUCUNE POLITIQUE RLS';
    RAISE NOTICE '   → Exécutez le script supabase-fix-rls-ultimate.sql';
  ELSIF policies_count = 3 THEN
    RAISE NOTICE '✅ TEST 5 : Politiques RLS configurées';
    RAISE NOTICE '   → Nombre de politiques: %', policies_count;
  ELSE
    RAISE NOTICE '⚠️  TEST 5 : NOMBRE DE POLITIQUES INCORRECT';
    RAISE NOTICE '   → Attendu: 3, Trouvé: %', policies_count;
    RAISE NOTICE '   → Exécutez le script supabase-fix-rls-ultimate.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '📋 RÉSUMÉ';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '🔴 PROBLÈME MAJEUR : Vous n''êtes pas connecté';
    RAISE NOTICE '   → Connectez-vous dans votre app et réessayez';
  ELSIF user_name IS NULL THEN
    RAISE NOTICE '🔴 PROBLÈME MAJEUR : Utilisateur non trouvé dans users';
    RAISE NOTICE '   → Vérifiez l''intégrité de votre base de données';
  ELSIF NOT is_super THEN
    RAISE NOTICE '🔴 PROBLÈME IDENTIFIÉ : Vous n''êtes pas Super Admin';
    RAISE NOTICE '   → Exécutez la commande UPDATE ci-dessus';
    RAISE NOTICE '   → Puis déconnectez-vous et reconnectez-vous';
  ELSIF settings_count = 0 OR policies_count != 3 THEN
    RAISE NOTICE '🔴 PROBLÈME : Configuration RLS incomplète';
    RAISE NOTICE '   → Exécutez supabase-fix-rls-ultimate.sql';
  ELSE
    RAISE NOTICE '🟢 TOUT SEMBLE CORRECT !';
    RAISE NOTICE '   → Si vous avez encore des erreurs :';
    RAISE NOTICE '     1. Déconnectez-vous de l''app';
    RAISE NOTICE '     2. Reconnectez-vous';
    RAISE NOTICE '     3. Vérifiez les logs de console';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

-- Afficher les détails de la configuration
SELECT 
  'Configuration actuelle' as section,
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_at,
  updated_by
FROM global_settings;

-- Afficher les politiques RLS
SELECT 
  'Politiques RLS' as section,
  policyname,
  cmd as type
FROM pg_policies 
WHERE tablename = 'global_settings' AND schemaname = 'public'
ORDER BY policyname;
