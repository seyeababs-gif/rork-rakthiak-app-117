# Guide de déploiement Netlify

## Problèmes identifiés et solutions

### 1. Les popups (Alert.alert) ne fonctionnent pas sur web ✅ RÉSOLU

**Problème:** `Alert.alert()` de React Native ne fonctionne pas correctement sur web.

**Solution:** Système de Toast cross-platform créé
- `contexts/ToastContext.tsx` - Gère les toasts et alerts
- `components/ToastContainer.tsx` - Affiche les toasts
- Intégré dans `app/_layout.tsx`

### 2. Configuration Netlify

Pour déployer sur Netlify, vous devez:

1. **Build Settings**:
   - Build command: `npx expo export -p web`
   - Publish directory: `dist`
   - Node version: 18 ou supérieur

2. **Fichier netlify.toml** à créer à la racine:
```toml
[build]
  command = "npx expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. **Variables d'environnement** à configurer sur Netlify:
   - `EXPO_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase

### 3. Corrections nécessaires dans le code

Les fichiers suivants utilisent encore `Alert.alert()` et doivent être mis à jour pour utiliser le système de toast:

- ✅ `contexts/MarketplaceContext.tsx` - ligne 142: `alert('Error loading products: ' + errorMsg);`
- ⏳ `app/(tabs)/add.tsx` - Tous les Alert.alert
- ⏳ `app/(tabs)/cart.tsx` - Alert.alert
- ⏳ `app/(tabs)/profile.tsx` - Alert.alert
- ⏳ `app/auth/login.tsx` - Alert.alert
- ⏳ `app/auth/register.tsx` - Alert.alert
- ⏳ `app/product/[id].tsx` - Alert.alert
- ⏳ `app/product/edit/[id].tsx` - Alert.alert
- ⏳ Autres fichiers à vérifier

### 4. Mode Admin sur web

Le problème avec le mode admin peut venir de:
- Les permissions ne sont pas correctement chargées depuis Supabase
- localStorage vs AsyncStorage

### 5. Produits ajoutés plusieurs fois

Ce problème est directement lié au fait que les toasts ne s'affichent pas, donc l'utilisateur ne sait pas si son action a réussi et clique plusieurs fois.

## Actions à faire maintenant

Je vais maintenant mettre à jour tous les fichiers pour remplacer Alert.alert par le système de toast.
