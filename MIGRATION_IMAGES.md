# Migration des Images Base64 vers Supabase Storage

## ⚠️ IMPORTANT : Configuration RLS Corrigée

Vous avez coché **service_role** dans la configuration du bucket. C'est **dangereux** car service_role contourne toutes les sécurités RLS.

### Configuration Correcte

Dans Supabase Dashboard > Storage > product-images > Policies :

#### Politique 1 : Upload
- **Target roles** : Cochez UNIQUEMENT `authenticated` et `anon`
- **NE PAS cocher** `service_role` (très important !)

#### Politique 2 : Read (Lecture)
- **Target roles** : Cochez `authenticated` et `anon`
- Il n'y a **pas de rôle "public"** dans la liste, c'est normal
- Les images seront accessibles car le bucket est configuré comme "Public"

---

## Migration Automatique des Images Existantes

### Étape 1 : Vérifier la Configuration du Bucket

1. Allez dans **Supabase Dashboard > Storage**
2. Cliquez sur le bucket `product-images`
3. Vérifiez que **Public bucket** est coché
4. Vérifiez les **Policies** :
   - Upload : `authenticated` + `anon` uniquement
   - Select : `authenticated` + `anon` uniquement
   - **AUCUNE politique avec `service_role`**

### Étape 2 : Lancer la Migration

La migration se fait en une seule commande :

```bash
npx tsx scripts/migrateBase64ToStorage.ts
```

### Ce que fait le script :

1. ✅ Récupère tous les produits de la base de données
2. ✅ Identifie les images au format Base64 (`data:image/...`)
3. ✅ Convertit chaque image Base64 en Blob
4. ✅ Upload chaque image dans Supabase Storage (`product-images/products/`)
5. ✅ Génère une URL publique pour chaque image
6. ✅ Met à jour la base de données avec les nouvelles URLs
7. ✅ Ignore les produits déjà migrés (qui ont déjà des URLs)

### Avantages après la migration :

✅ **Chargement ultra-rapide** : Les images sont servies depuis le CDN Supabase
✅ **Base de données allégée** : Plus de Base64 stocké (économie de 70-90%)
✅ **Cache automatique** : Les images sont mises en cache
✅ **Optimisation automatique** : Redimensionnement et compression à la volée
✅ **Compatibilité totale** : Fonctionne avec le code existant

---

## Après la Migration

### Vérification

1. Ouvrez l'application
2. Les images devraient se charger **beaucoup plus rapidement**
3. Vérifiez dans Supabase Dashboard > Storage > product-images que les images sont là

### Performances Attendues

- **Avant** (Base64) : ~500-2000ms par image
- **Après** (Storage) : ~50-200ms par image
- **Amélioration** : 5-10x plus rapide ! ⚡

### En cas de problème

Si certaines images ne s'affichent pas :

1. Vérifiez que le bucket est **public**
2. Vérifiez les **policies RLS** (pas de service_role)
3. Relancez le script de migration
4. Consultez les logs pour voir les erreurs

---

## Futur : Nouveaux Produits

Les nouveaux produits ajoutés utiliseront **automatiquement** Supabase Storage grâce à la fonction `uploadImageToStorage()` déjà intégrée dans :

- `lib/supabase.ts` : Fonction d'upload
- `contexts/MarketplaceContext.tsx` : Intégration lors de l'ajout de produits

Plus besoin de faire quoi que ce soit, tout est automatique ! 🎉
