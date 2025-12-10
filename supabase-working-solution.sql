-- SOLUTION FINALE POUR GLOBAL SETTINGS
-- Ce script ajoute les colonnes manquantes et configure les RLS correctement

-- 1. Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'premium_enabled') THEN
    ALTER TABLE public.global_settings ADD COLUMN premium_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne premium_enabled ajoutée';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'message_text') THEN
    ALTER TABLE public.global_settings ADD COLUMN message_text TEXT DEFAULT 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal';
    RAISE NOTICE 'Colonne message_text ajoutée';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'commission_rate') THEN
    ALTER TABLE public.global_settings ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT 10.0;
    RAISE NOTICE 'Colonne commission_rate ajoutée';
  END IF;
END $$;

-- 2. Migrer les données des anciennes colonnes vers les nouvelles (si elles existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'is_global_premium_enabled') THEN
    UPDATE public.global_settings SET premium_enabled = is_global_premium_enabled;
    RAISE NOTICE 'Données migrées: is_global_premium_enabled -> premium_enabled';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'scrolling_message') THEN
    UPDATE public.global_settings SET message_text = scrolling_message;
    RAISE NOTICE 'Données migrées: scrolling_message -> message_text';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'commission_percentage') THEN
    UPDATE public.global_settings SET commission_rate = commission_percentage;
    RAISE NOTICE 'Données migrées: commission_percentage -> commission_rate';
  END IF;
END $$;

-- 3. S'assurer que la ligne de configuration existe
INSERT INTO public.global_settings (id, premium_enabled, message_text, commission_rate)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
  10.0
)
ON CONFLICT (id) DO UPDATE SET
  premium_enabled = COALESCE(global_settings.premium_enabled, FALSE),
  message_text = COALESCE(global_settings.message_text, 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal'),
  commission_rate = COALESCE(global_settings.commission_rate, 10.0);

-- 4. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Only super admin can update global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent insert on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Prevent delete on global settings" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_read_all" ON public.global_settings;
DROP POLICY IF EXISTS "global_settings_update_super_admin_only" ON public.global_settings;

-- 6. Créer les policies finales
-- Lecture publique
CREATE POLICY "global_settings_read_all"
ON public.global_settings
FOR SELECT
USING (true);

-- UPDATE uniquement pour super admin (avec UPSERT support)
CREATE POLICY "global_settings_upsert_super_admin"
ON public.global_settings
FOR ALL
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

-- 7. Afficher le résultat
SELECT 
  id,
  premium_enabled,
  message_text,
  commission_rate,
  updated_at
FROM public.global_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 8. Logs de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Configuration terminée avec succès !';
  RAISE NOTICE '✅ Colonnes: premium_enabled, message_text, commission_rate';
  RAISE NOTICE '✅ RLS configuré: lecture publique, modification super admin uniquement';
END $$;
