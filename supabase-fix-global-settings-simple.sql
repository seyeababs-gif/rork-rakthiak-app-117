-- 🔥 FIX SIMPLE - GLOBAL SETTINGS
-- Le problème : auth.uid() retourne UUID mais users.id est TEXT
-- Solution : cast auth.uid() en TEXT

-- 1. Supprimer la table et la recréer
DROP TABLE IF EXISTS public.global_settings CASCADE;

CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_global_premium_enabled BOOLEAN NOT NULL DEFAULT false,
  scrolling_message TEXT NOT NULL DEFAULT '',
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insérer la ligne par défaut
INSERT INTO public.global_settings (
  id, 
  is_global_premium_enabled, 
  scrolling_message, 
  commission_percentage
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID, 
  false, 
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal', 
  12.5
);

-- 3. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 4. Politique de lecture pour tout le monde
CREATE POLICY "Anyone can read settings"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- 5. Politique d'update pour les admins - AVEC CAST
CREATE POLICY "Admins can update settings"
ON public.global_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::TEXT 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::TEXT 
    AND users.is_admin = true
  )
);

-- 6. Politique d'insert pour les admins - AVEC CAST
CREATE POLICY "Admins can insert settings"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::TEXT 
    AND users.is_admin = true
  )
);

-- 7. Vérification
SELECT '✅ Table global_settings créée avec succès' as status;
SELECT '✅ RLS configuré avec cast UUID->TEXT' as status;
SELECT '✅ Tous les admins peuvent maintenant modifier' as status;
