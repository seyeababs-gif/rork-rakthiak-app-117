# 🔧 SOLUTION FINALE - Problème RLS Global Settings

## 🎯 Problème
L'erreur `42501: new row violates row-level security policy for table "global_settings"` survient lors de la modification des paramètres globaux.

## ✅ Solution en 3 étapes

### Étape 1 : Exécuter le script SQL de réparation

Exécutez le fichier **`supabase-fix-rls-ultimate.sql`** dans l'éditeur SQL de Supabase.

Ce script va :
- ✓ Supprimer toutes les anciennes politiques RLS conflictuelles
- ✓ Créer/vérifier la ligne de configuration unique
- ✓ Créer les nouvelles politiques RLS correctes
- ✓ Vérifier votre statut Super Admin

### Étape 2 : Vérifier votre statut Super Admin

Après l'exécution du script, **lisez attentivement les logs** dans l'éditeur SQL de Supabase.

Si vous voyez :
```
❌ Utilisateur: [Votre nom] ([Votre ID]) - PAS SUPER ADMIN
```

Alors exécutez cette commande SQL (remplacez `VOTRE_ID` par votre ID affiché) :
```sql
UPDATE users SET is_super_admin = true WHERE id = 'VOTRE_ID';
```

### Étape 3 : Se reconnecter dans l'application

1. **Déconnectez-vous** complètement de l'application
2. **Reconnectez-vous** avec votre compte
3. Testez la modification des paramètres dans l'onglet Admin

## 🔍 Vérifications

### Comment savoir si c'est réglé ?

1. Dans Supabase SQL Editor, exécutez :
```sql
SELECT 
  u.id,
  u.name,
  u.is_super_admin,
  gs.*
FROM users u
CROSS JOIN global_settings gs
WHERE u.id = auth.uid()::text;
```

Vous devriez voir :
- ✅ `is_super_admin` = `true`
- ✅ Une ligne de configuration dans `global_settings`

2. Dans les logs de votre app React Native, vous devriez voir :
```
[GLOBAL SETTINGS] Current user: [VOTRE_ID] true
[GLOBAL SETTINGS] ✅ Settings updated successfully
```

## 🐛 Dépannage

### Si l'erreur persiste après ces étapes

1. **Vérifiez que vous êtes bien connecté** :
   ```sql
   SELECT auth.uid()::text as my_user_id;
   ```
   Si c'est `NULL`, vous n'êtes pas connecté.

2. **Vérifiez les politiques actives** :
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'global_settings';
   ```
   Vous devriez voir 3 politiques :
   - `global_settings_read_all` (SELECT)
   - `global_settings_update_super_admin` (UPDATE)
   - `global_settings_insert_super_admin` (INSERT)

3. **Vérifiez la ligne de configuration** :
   ```sql
   SELECT * FROM global_settings;
   ```
   Il doit y avoir exactement 1 ligne avec l'ID `00000000-0000-0000-0000-000000000001`

## 📝 Fichiers modifiés

- ✅ **`supabase-fix-rls-ultimate.sql`** : Script SQL de réparation
- ✅ **`contexts/GlobalSettingsContext.tsx`** : Gestion d'erreur améliorée

## 🎉 Après la correction

Une fois le problème résolu, vous pourrez :
- ✅ Activer/désactiver le Premium Global
- ✅ Modifier le message défilant
- ✅ Ajuster le pourcentage de commission
- ✅ Voir les changements immédiatement dans l'app

---

**Note importante** : Seul le compte avec `is_super_admin = true` peut modifier ces paramètres. C'est une sécurité intentionnelle.
