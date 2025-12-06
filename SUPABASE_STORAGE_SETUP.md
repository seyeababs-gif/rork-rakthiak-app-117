# Configuration Supabase Storage pour les Images

## Étape 1 : Créer le Bucket

1. Connectez-vous à votre tableau de bord Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **Storage**
4. Cliquez sur **New Bucket**
5. Nom du bucket : `product-images`
6. **Public bucket** : Cochez cette case (important pour les URLs publiques)
7. Cliquez sur **Create bucket**

## Étape 2 : Configurer les Politiques de Sécurité (RLS)

### Politique 1 : Autoriser l'Upload pour les Utilisateurs Authentifiés

1. Allez dans **Storage** > Cliquez sur le bucket `product-images`
2. Cliquez sur l'onglet **Policies**
3. Cliquez sur **New Policy**
4. Sélectionnez **Custom Policy**
5. Remplissez les champs :
   - **Policy name** : `Allow authenticated users to upload`
   - **Allowed operations** : Cochez `INSERT`
   - **Target roles** : `authenticated` et `anon` (PAS service_role !)
   - **Policy definition** : 
   ```sql
   true
   ```
6. Cliquez sur **Review** puis **Save policy**

### Politique 2 : Autoriser la Lecture Publique

1. Cliquez sur **New Policy** à nouveau
2. Sélectionnez **Custom Policy**
3. Remplissez les champs :
   - **Policy name** : `Allow public read access`
   - **Allowed operations** : Cochez `SELECT`
   - **Target roles** : `authenticated` et `anon` (il n'y a pas de rôle "public" dans la liste, c'est normal)
   - **Policy definition** : 
   ```sql
   true
   ```
4. Cliquez sur **Review** puis **Save policy**

## Étape 3 : Vérifier la Configuration

Pour vérifier que tout fonctionne :

1. Essayez d'ajouter un produit avec une image depuis votre application
2. L'image devrait être uploadée automatiquement dans le bucket `product-images/products/`
3. Une URL publique devrait être générée et stockée dans la base de données
4. L'image devrait être visible dans l'application

## Étape 4 : Optimisation de la Transformation d'Images (Optionnel)

Supabase Storage supporte la transformation d'images à la volée. Les URLs générées peuvent être optimisées avec des paramètres :

- `width` : Largeur de l'image
- `height` : Hauteur de l'image
- `quality` : Qualité (0-100)
- `format` : Format de sortie (webp, jpg, png)

Exemple :
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/product-images/products/image.jpg?width=400&quality=60&format=webp
```

Ces optimisations sont déjà intégrées dans les fonctions `getOptimizedImageUrl()` et `getThumbnailUrl()` du fichier `lib/supabase.ts`.

## Avantages de Supabase Storage vs Base64

✅ **Performance** : Les images sont chargées directement depuis le CDN de Supabase, beaucoup plus rapide que Base64
✅ **Taille de la base de données** : La base de données ne stocke que les URLs (petites), pas les images (grandes)
✅ **Optimisation automatique** : Transformation d'images à la volée (redimensionnement, format, compression)
✅ **Cache** : Les images sont mises en cache par le CDN pour un chargement ultra-rapide
✅ **Bande passante** : Réduction significative de la bande passante utilisée

## Dépannage

### Erreur "Policy violation"
- Vérifiez que les politiques RLS sont bien configurées
- Assurez-vous que le bucket est public

### Erreur "Bucket not found"
- Vérifiez que le bucket `product-images` existe
- Vérifiez que vous utilisez le bon projet Supabase

### Images non affichées
- Vérifiez que le bucket est public
- Vérifiez que la politique de lecture publique est activée
- Vérifiez l'URL générée dans la console
