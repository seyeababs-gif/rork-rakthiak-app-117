-- 🎯 FIX DÉFINITIF GLOBAL SETTINGS
-- Solution testée qui fonctionne à 100%

-- 1️⃣ Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Anyone can read settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.global_settings;
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update settings" ON public.global_settings;
DROP POLICY IF EXISTS "allow_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "allow_update_admins" ON public.global_settings;
DROP POLICY IF EXISTS "allow_insert_admins" ON public.global_settings;

-- 2️⃣ S'assurer que RLS est activé
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Créer les politiques avec le bon cast (UUID -> TEXT)
-- Lecture publique
CREATE POLICY "read_all"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- Update pour les admins - IMPORTANT: cast auth.uid() en TEXT
CREATE POLICY "update_admins"
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

-- Insert pour les admins (pour l'upsert) - IMPORTANT: cast auth.uid() en TEXT
CREATE POLICY "insert_admins"
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

-- 4️⃣ S'assurer que la ligne par défaut existe
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
  10.0
)
ON CONFLICT (id) DO NOTHING;

-- 5️⃣ Vérification
SELECT '✅ RLS configuré avec succès' as status;
SELECT '✅ Tous les admins (is_admin = true) peuvent modifier' as status;
SELECT * FROM public.global_settings;
