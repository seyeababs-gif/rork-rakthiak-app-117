-- ===================================================================
-- SCRIPT DE RÉPARATION GLOBAL SETTINGS
-- Ce script garantit que la configuration globale fonctionne à 100%
-- ===================================================================

-- 1. VÉRIFIER VOTRE STATUT SUPER ADMIN
SELECT 
  id, 
  email, 
  name, 
  is_super_admin,
  CASE 
    WHEN is_super_admin = true THEN '✅ Vous êtes Super Admin'
    ELSE '❌ Vous n''êtes PAS Super Admin - Contactez un administrateur'
  END AS statut
FROM public.users
WHERE id = auth.uid()::text;

-- Si la requête ci-dessus renvoie "is_super_admin = false", exécutez ceci :
-- UPDATE public.users SET is_super_admin = true WHERE email = 'votre.email@example.com';

-- ===================================================================
-- 2. SUPPRIMER ET RECRÉER LA TABLE (SOLUTION RADICALE)
-- ===================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Super admin can insert global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Super admin can upsert global settings" ON public.global_settings;

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS enforce_single_settings_row ON public.global_settings;
DROP TRIGGER IF EXISTS update_settings_timestamp ON public.global_settings;

-- Supprimer la table
DROP TABLE IF EXISTS public.global_settings CASCADE;

-- ===================================================================
-- 3. RECRÉER LA TABLE
-- ===================================================================

CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  is_global_premium_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  scrolling_message TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal' NOT NULL,
  commission_percentage NUMERIC(5,2) DEFAULT 10.0 NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by TEXT
);

-- ===================================================================
-- 4. INSÉRER LA LIGNE UNIQUE DE CONFIGURATION
-- ===================================================================

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
)
ON CONFLICT (id) DO NOTHING;

-- Vérifier l'insertion
SELECT * FROM public.global_settings;

-- ===================================================================
-- 5. ACTIVER RLS
-- ===================================================================

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 6. POLICIES - LECTURE PUBLIQUE
-- ===================================================================

CREATE POLICY "Public can read global settings"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- ===================================================================
-- 7. POLICIES - MODIFICATION SUPER ADMIN UNIQUEMENT
-- ===================================================================

-- Policy pour UPDATE
CREATE POLICY "Super admin can update global settings"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
);

-- Policy pour INSERT (UPSERT utilise INSERT + UPDATE)
CREATE POLICY "Super admin can insert global settings"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.is_super_admin = true
  )
  AND id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Policy pour bloquer les DELETE
CREATE POLICY "Prevent delete on global settings"
ON public.global_settings
FOR DELETE
TO public
USING (false);

-- ===================================================================
-- 8. FONCTION AUTO-UPDATE updated_at
-- ===================================================================

CREATE OR REPLACE FUNCTION public.update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_timestamp
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_settings_timestamp();

-- ===================================================================
-- 9. TEST FINAL - VÉRIFIER QUE TOUT FONCTIONNE
-- ===================================================================

-- Vérifier que la ligne existe
SELECT 
  id,
  is_global_premium_enabled AS premium,
  scrolling_message AS message,
  commission_percentage AS commission,
  updated_at,
  updated_by
FROM public.global_settings;

-- Tester un UPDATE (remplacez les valeurs par ce que vous voulez)
UPDATE public.global_settings
SET 
  is_global_premium_enabled = true,
  scrolling_message = 'Test de modification réussie !',
  commission_percentage = 15.0
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Vérifier que la modification a bien été appliquée
SELECT * FROM public.global_settings;

-- ===================================================================
-- 10. RÉSULTAT ATTENDU
-- ===================================================================
-- Vous devriez voir :
-- ✅ Une ligne avec les nouvelles valeurs
-- ✅ updated_at qui a changé automatiquement
-- ✅ updated_by qui contient votre user_id (si défini dans le trigger)

-- Si tout fonctionne ici mais pas dans l'app, c'est un problème de permission RLS.
-- Exécutez cette requête pour débugger :

SELECT 
  auth.uid() AS "Votre User ID",
  (SELECT is_super_admin FROM public.users WHERE id = auth.uid()::text) AS "Êtes-vous Super Admin ?";
