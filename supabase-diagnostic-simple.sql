-- DIAGNOSTIC SIMPLE pour trouver le probleme

-- 1. Verifier votre utilisateur actuel
SELECT 
  auth.uid() as uuid_supabase,
  auth.uid()::text as uuid_en_text,
  auth.email() as email_connecte;

-- 2. Verifier les admins dans la table users
SELECT 
  id,
  name,
  email,
  is_admin,
  is_super_admin,
  pg_typeof(id) as type_de_id
FROM public.users
WHERE is_admin = true OR is_super_admin = true;

-- 3. Verifier si vous etes admin
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND is_admin = true
    ) THEN 'OK - Vous etes ADMIN'
    ELSE 'KO - Vous netes PAS admin'
  END as statut;

-- 4. Voir les policies actuelles
SELECT 
  policyname,
  cmd as commande,
  qual as condition_using,
  with_check as condition_with_check
FROM pg_policies
WHERE tablename = 'global_settings';

-- 5. Verifier la structure de global_settings
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'global_settings'
ORDER BY ordinal_position;

-- 6. Voir le contenu actuel
SELECT * FROM public.global_settings;
