-- SOLUTION FINALE SIMPLE ET FONCTIONNELLE

-- 1. DROP et recréer la table
DROP TABLE IF EXISTS public.global_settings CASCADE;

CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  premium_enabled BOOLEAN DEFAULT false,
  message_text TEXT DEFAULT '',
  commission_rate NUMERIC DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserer une ligne par defaut
INSERT INTO public.global_settings (premium_enabled, message_text, commission_rate)
VALUES (false, '', 10);

-- 3. Activer RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 4. POLICY LECTURE : tout le monde peut lire
DROP POLICY IF EXISTS "read_global_settings" ON public.global_settings;
CREATE POLICY "read_global_settings" 
ON public.global_settings 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- 5. POLICY UPDATE : tous les admins peuvent modifier
DROP POLICY IF EXISTS "update_global_settings" ON public.global_settings;
CREATE POLICY "update_global_settings" 
ON public.global_settings 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.is_admin = true
  )
);

-- 6. POLICY INSERT : tous les admins peuvent inserer (au cas ou)
DROP POLICY IF EXISTS "insert_global_settings" ON public.global_settings;
CREATE POLICY "insert_global_settings" 
ON public.global_settings 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE users.id = auth.uid()::text 
    AND users.is_admin = true
  )
);

-- 7. Verifier que tout est OK
SELECT 'Table creee avec succes' as status;
SELECT * FROM public.global_settings;
