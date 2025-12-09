-- ===================================================================
-- CORRECTION DÉFINITIVE : GLOBAL SETTINGS AVEC UPSERT
-- ===================================================================

-- 1. SUPPRIMER LE TRIGGER QUI BLOQUE LES INSERT
DROP TRIGGER IF EXISTS enforce_single_settings_row ON public.global_settings;
DROP FUNCTION IF EXISTS public.prevent_multiple_settings_rows();

-- 2. VÉRIFIER SI LA LIGNE EXISTE
DO $$
BEGIN
  -- Insérer la ligne si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.global_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid) THEN
    INSERT INTO public.global_settings (
      id,
      is_global_premium_enabled,
      scrolling_message,
      commission_percentage,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      FALSE,
      'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
      10.0,
      NOW()
    );
    RAISE NOTICE '✅ Ligne de configuration créée';
  ELSE
    RAISE NOTICE '✅ Ligne de configuration existe déjà';
  END IF;
END $$;

-- 3. VÉRIFIER QUE LA LIGNE EST BIEN LÀ
SELECT 
  id,
  is_global_premium_enabled AS premium,
  scrolling_message AS message,
  commission_percentage AS commission,
  updated_at,
  updated_by,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001'::uuid THEN '✅ Configuration OK'
    ELSE '❌ Mauvais ID'
  END AS status
FROM public.global_settings;

-- 4. VÉRIFIER VOS PERMISSIONS SUPER ADMIN
SELECT 
  id,
  email,
  name,
  is_super_admin,
  CASE 
    WHEN is_super_admin = true THEN '✅ Vous êtes Super Admin'
    ELSE '❌ PAS Super Admin - Exécutez: UPDATE users SET is_super_admin = true WHERE id = ''' || id || ''';'
  END AS action
FROM public.users
WHERE id = auth.uid()::text;

-- ===================================================================
-- 5. TEST UPSERT (Création ou Mise à jour)
-- ===================================================================
-- Cette requête simule ce que fait l'app avec UPSERT

-- Test 1 : Modifier les valeurs existantes
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_by
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  true,
  'Message de test depuis SQL',
  12.5,
  auth.uid()::text
)
ON CONFLICT (id) DO UPDATE SET
  is_global_premium_enabled = EXCLUDED.is_global_premium_enabled,
  scrolling_message = EXCLUDED.scrolling_message,
  commission_percentage = EXCLUDED.commission_percentage,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

-- Vérifier le résultat
SELECT * FROM public.global_settings;

-- ===================================================================
-- SI VOUS VOYEZ LES NOUVELLES VALEURS CI-DESSUS, C'EST BON !
-- ===================================================================
