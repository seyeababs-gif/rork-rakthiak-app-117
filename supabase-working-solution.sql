-- ✅ SOLUTION FINALE ULTRA-SIMPLE QUI MARCHE
-- Donne les droits à TOUS les ADMINS (is_admin = true)

-- ÉTAPE 1: Supprimer TOUTES les anciennes politiques
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'global_settings' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.global_settings', pol.policyname);
  END LOOP;
END $$;

-- ÉTAPE 2: S'assurer que RLS est activé
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer des politiques SIMPLES qui MARCHENT
-- Tout le monde peut lire
CREATE POLICY "allow_select_to_all"
  ON public.global_settings
  FOR SELECT
  USING (true);

-- Tous les ADMINS peuvent UPDATE
CREATE POLICY "allow_update_to_admins"
  ON public.global_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text
      AND users.is_admin = true
    )
  );

-- Tous les ADMINS peuvent INSERT (pour les UPSERT)
CREATE POLICY "allow_insert_to_admins"
  ON public.global_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text
      AND users.is_admin = true
    )
  );

-- ÉTAPE 4: S'assurer que la ligne de configuration existe
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  FALSE,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0
)
ON CONFLICT (id) DO UPDATE SET
  is_global_premium_enabled = COALESCE(global_settings.is_global_premium_enabled, FALSE),
  scrolling_message = COALESCE(global_settings.scrolling_message, 'Bienvenue sur Rakthiak'),
  commission_percentage = COALESCE(global_settings.commission_percentage, 10.0);

-- ÉTAPE 5: Vérifier que tout est OK
SELECT 
  '✅ Configuration terminée avec succès!' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'global_settings') as nombre_politiques,
  (SELECT COUNT(*) FROM public.global_settings) as nombre_lignes;

-- Afficher les politiques actives
SELECT 
  policyname as nom_politique,
  cmd as commande,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Lecture'
    WHEN cmd = 'UPDATE' THEN '✏️ Modification'
    WHEN cmd = 'INSERT' THEN '➕ Insertion'
    WHEN cmd = 'DELETE' THEN '🗑️ Suppression'
  END as type
FROM pg_policies 
WHERE tablename = 'global_settings' 
  AND schemaname = 'public'
ORDER BY cmd;

-- Afficher la configuration actuelle
SELECT * FROM public.global_settings;
