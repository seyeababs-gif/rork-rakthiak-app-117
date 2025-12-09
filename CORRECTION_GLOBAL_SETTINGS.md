# 🔧 Correction du système de configuration globale

## Problèmes identifiés

1. **Erreur RLS (Row Level Security)** : "new row violates row-level security policy" (Code: 42501)
   - La policy RLS bloquait l'INSERT nécessaire pour l'UPSERT
   - Le code utilisait `.upsert()` mais la policy interdisait les INSERT

2. **Message défilant absent** : Le composant ScrollingText n'était pas affiché sur la page d'accueil

## ✅ Solutions appliquées

### 1. Correction des politiques RLS (supabase-fix-rls-upsert.sql)

**Anciennes policies (PROBLÉMATIQUES)** :
```sql
-- Bloquait TOUT insert
CREATE POLICY "Prevent insert on global settings"
ON public.global_settings
FOR INSERT
TO public
WITH CHECK (false);
```

**Nouvelles policies (CORRIGÉES)** :
```sql
-- Autorise INSERT uniquement pour Super Admin et ID fixe
CREATE POLICY "global_settings_insert_policy"
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
```

**Pourquoi ça marche maintenant ?**
- `.upsert()` essaie d'INSERT si la ligne n'existe pas, puis fait UPDATE si elle existe
- La nouvelle policy autorise l'INSERT mais UNIQUEMENT :
  - Pour les Super Admins (vérification dans la table users)
  - Pour l'ID fixe '00000000-0000-0000-0000-000000000001'

### 2. Affichage du ScrollingText sur la page d'accueil

**Modification de app/(tabs)/index.tsx** :
```tsx
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import ScrollingText from '@/components/ScrollingText';

// Dans le composant
const { bannerMessage } = useGlobalSettings();

return (
  <View style={styles.container}>
    {bannerMessage && (
      <ScrollingText 
        message={bannerMessage}
        speed={50}
        backgroundColor="#00A651"
        textColor="#FFFFFF"
        height={32}
        fontSize={14}
      />
    )}
    <LinearGradient ...>
      {/* Header */}
    </LinearGradient>
    ...
  </View>
);
```

## 📋 Instructions d'utilisation

### Étape 1 : Exécuter le script SQL de correction

1. Ouvrez votre dashboard Supabase
2. Allez dans SQL Editor
3. Copiez le contenu de `supabase-fix-rls-upsert.sql`
4. Exécutez le script

### Étape 2 : Vérifier que vous êtes Super Admin

Le script affichera automatiquement votre statut. Si vous n'êtes PAS super admin, il vous donnera la commande à exécuter :

```sql
UPDATE users SET is_super_admin = true WHERE id = 'VOTRE_ID';
```

### Étape 3 : Tester dans l'application

1. Ouvrez l'app et connectez-vous avec votre compte Super Admin
2. Allez dans Admin > Réglages
3. Modifiez les paramètres :
   - **Mode Premium Global** : Active/Désactive le premium pour tous
   - **Message défilant** : Le texte qui s'affichera en haut de l'accueil
   - **Commission (%)** : Le taux de commission (entre 0 et 100)
4. Cliquez sur "Enregistrer les modifications"
5. Le message devrait s'afficher immédiatement sur la page d'accueil

## 🧪 Test manuel dans Supabase

Pour tester l'UPSERT directement depuis SQL Editor :

```sql
-- Test de modification
INSERT INTO public.global_settings (
  id,
  is_global_premium_enabled,
  scrolling_message,
  commission_percentage,
  updated_by
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  true,
  'Message de test - Promotion spéciale ce week-end !',
  12.5,
  auth.uid()::text
)
ON CONFLICT (id) DO UPDATE SET
  is_global_premium_enabled = EXCLUDED.is_global_premium_enabled,
  scrolling_message = EXCLUDED.scrolling_message,
  commission_percentage = EXCLUDED.commission_percentage,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

-- Vérifier le résultat
SELECT * FROM public.global_settings;
```

Si cela fonctionne dans SQL Editor, cela fonctionnera dans l'app !

## 🎨 Apparence du ScrollingText

Le message défile horizontalement en haut de la page d'accueil :
- **Couleur de fond** : Vert (#00A651)
- **Couleur du texte** : Blanc
- **Hauteur** : 32px
- **Animation** : Défilement fluide de droite à gauche
- **Vitesse** : 50 pixels/seconde

## ⚠️ Points importants

1. **Seul le Super Admin peut modifier** les paramètres globaux
2. **Une seule ligne de configuration** existe dans la base (ID fixe)
3. **L'UPSERT est nécessaire** car on ne sait pas toujours si la ligne existe
4. **Le ScrollingText n'apparaît que si** `bannerMessage` n'est pas vide

## 🔍 Debugging

Si l'erreur RLS persiste :

```sql
-- Vérifier vos policies actuelles
SELECT * FROM pg_policies WHERE tablename = 'global_settings';

-- Vérifier votre statut Super Admin
SELECT id, name, email, is_super_admin FROM users WHERE id = auth.uid()::text;
```

Si le message ne s'affiche pas :

```typescript
// Dans la console du navigateur (F12)
// Vérifiez que le message est bien chargé
console.log('[GLOBAL SETTINGS] Banner message:', bannerMessage);
```

## 📦 Fichiers modifiés

1. `supabase-fix-rls-upsert.sql` (NOUVEAU) - Correction des policies RLS
2. `app/(tabs)/index.tsx` (MODIFIÉ) - Ajout du ScrollingText
3. `CORRECTION_GLOBAL_SETTINGS.md` (NOUVEAU) - Cette documentation

## ✨ Fonctionnalités complètes

Après correction, le système permet :

✅ **Mode Premium Global** : Activer le premium pour tous les utilisateurs  
✅ **Message défilant** : Afficher des annonces/promotions en temps réel  
✅ **Commission dynamique** : Ajuster le taux de commission facilement  
✅ **Interface Admin intuitive** : Modifier les paramètres en quelques clics  
✅ **Sécurité RLS** : Seul le Super Admin peut modifier  
✅ **Animation fluide** : Message défilant à 60fps  

---

**Auteur** : Système de configuration globale Rakthiak  
**Date** : 2025-12-09  
**Version** : 1.0.0
