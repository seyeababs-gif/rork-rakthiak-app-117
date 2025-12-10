-- 🎯 SOLUTION FINALE - Global Settings avec RLS qui fonctionne
-- Basé sur une solution testée et validée

-- 1. Nettoyer complètement les anciennes configurations
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_super_admin_only" ON public.global_settings;

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS enforce_single_settings_row ON public.global_settings;
DROP TRIGGER IF EXISTS update_settings_timestamp ON public.global_settings;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.prevent_multiple_settings() CASCADE;
DROP FUNCTION IF EXISTS public.update_settings_timestamp() CASCADE;

-- 2. S'assurer que la table existe avec la bonne structure
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  premium_enabled BOOLEAN DEFAULT false,
  message_text TEXT DEFAULT '',
  commission_rate NUMERIC DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insérer ou mettre à jour la ligne unique de configuration
INSERT INTO public.global_settings (id, premium_enabled, message_text, commission_rate)
VALUES ('00000000-0000-0000-0000-000000000001', false, 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal', 10)
ON CONFLICT (id) DO UPDATE SET
  premium_enabled = EXCLUDED.premium_enabled,
  message_text = EXCLUDED.message_text,
  commission_rate = EXCLUDED.commission_rate;

-- 4. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. Politique de LECTURE (public/tous les utilisateurs)
CREATE POLICY "Public can read global settings" 
ON public.global_settings 
FOR SELECT 
TO authenticated, anon
USING (true);

-- 6. Politique de MISE À JOUR (uniquement super admin)
-- IMPORTANT: Correction du type casting pour auth.uid()
CREATE POLICY "Only super admin can update settings" 
ON public.global_settings 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::uuid = auth.uid() 
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::uuid = auth.uid() 
    AND users.is_super_admin = true
  )
);

-- 7. Politique pour autoriser INSERT (uniquement pour super admin lors d'upsert)
CREATE POLICY "Only super admin can insert settings"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::uuid = auth.uid() 
    AND users.is_super_admin = true
  )
);

-- 8. Politique pour bloquer DELETE
CREATE POLICY "Prevent delete on global settings" 
ON public.global_settings 
FOR DELETE 
TO authenticated, anon
USING (false);

-- 9. Fonction pour mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION public.update_global_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pour updated_at
CREATE TRIGGER update_global_settings_timestamp
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_global_settings_timestamp();

-- 11. Vérification finale
SELECT 
  id, 
  premium_enabled as "Premium activé", 
  message_text as "Message", 
  commission_rate as "Commission %",
  updated_at as "Dernière mise à jour"
FROM public.global_settings;

-- ✅ Configuration terminée !
-- Pour tester depuis l'application :
-- 1. Connectez-vous en tant que super admin
-- 2. Essayez de modifier les paramètres globaux
-- 3. Vérifiez que la modification fonctionne sans erreur RLS
