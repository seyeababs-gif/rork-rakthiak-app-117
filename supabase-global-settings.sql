-- Script SQL pour la configuration globale de l'application
-- Table: global_settings

-- 1. Créer la table global_settings
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_global_premium_enabled BOOLEAN DEFAULT FALSE,
  scrolling_message TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  commission_percentage NUMERIC(5,2) DEFAULT 10.0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- 2. Insérer la ligne de configuration par défaut (SEULE ligne de configuration)
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0
)
ON CONFLICT (id) DO NOTHING;

-- 3. Fonction pour empêcher l'insertion de plusieurs lignes (IMPORTANT: Une seule config)
CREATE OR REPLACE FUNCTION public.prevent_multiple_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.global_settings) >= 1 THEN
    RAISE EXCEPTION 'Une seule ligne de configuration est autorisée. Utilisez UPDATE au lieu de INSERT.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour empêcher les insertions multiples
DROP TRIGGER IF EXISTS enforce_single_settings_row ON public.global_settings;
CREATE TRIGGER enforce_single_settings_row
BEFORE INSERT ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_multiple_settings();

-- 5. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_settings_timestamp ON public.global_settings;
CREATE TRIGGER update_settings_timestamp
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_settings_timestamp();

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut LIRE la configuration
CREATE POLICY "Public can read global settings"
ON public.global_settings
FOR SELECT
TO public
USING (true);

-- Policy: Seuls les admins peuvent MODIFIER la configuration
-- Note: Vous devez avoir une colonne is_admin dans votre table users
CREATE POLICY "Admins can update global settings"
ON public.global_settings
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND (users.is_admin = true OR users.is_super_admin = true)
  )
);

-- Policy: Bloquer les INSERT (sauf celui par défaut déjà inséré)
CREATE POLICY "Prevent insert on global settings"
ON public.global_settings
FOR INSERT
TO public
WITH CHECK (false);

-- Policy: Bloquer les DELETE
CREATE POLICY "Prevent delete on global settings"
ON public.global_settings
FOR DELETE
TO public
USING (false);

-- 8. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_global_settings_id ON public.global_settings(id);

-- 9. Commentaires pour documentation
COMMENT ON TABLE public.global_settings IS 'Configuration globale de l''application (une seule ligne)';
COMMENT ON COLUMN public.global_settings.is_global_premium_enabled IS 'Active/désactive le mode Premium global';
COMMENT ON COLUMN public.global_settings.scrolling_message IS 'Message défilant affiché dans l''application';
COMMENT ON COLUMN public.global_settings.commission_percentage IS 'Pourcentage de commission sur les ventes (0-100)';
COMMENT ON COLUMN public.global_settings.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN public.global_settings.updated_by IS 'ID de l''utilisateur qui a modifié la config';

-- 10. Afficher la configuration
SELECT * FROM public.global_settings;
