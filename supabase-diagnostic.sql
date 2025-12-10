-- 🔍 DIAGNOSTIC COMPLET pour trouver le problème

-- 1. Vérifier votre utilisateur actuel
SELECT 
  auth.uid() as "UUID Supabase",
  auth.uid()::text as "UUID en TEXT",
  auth.email() as "Email connecté";

-- 2. Vérifier les admins dans la table users
SELECT 
  id,
  name,
  email,
  is_admin,
  is_super_admin,
  pg_typeof(id) as "Type de id"
FROM public.users
WHERE is_admin = true OR is_super_admin = true;

-- 3. Vérifier si vous êtes admin
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND is_admin = true
    ) THEN '✅ Vous êtes ADMIN'
    ELSE '❌ Vous n\'êtes PAS admin'
  END as "Statut";

-- 4. Voir les policies actuelles
SELECT 
  policyname,
  cmd as "Commande",
  qual as "Condition USING",
  with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE tablename = 'global_settings';

-- 5. Vérifier la structure de global_settings
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'global_settings'
ORDER BY ordinal_position;

-- 6. Voir le contenu actuel
SELECT * FROM public.global_settings;
