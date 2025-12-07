# Rich Preview & SEO - Guide Complet

## ✅ Ce qui a été fait

### 1. **Open Graph Tags Dynamiques** 
Ajout des balises OG dans `app/product/[id].tsx` et `app/shop/[sellerId].tsx` :

- ✅ `og:title` - Titre du produit/boutique
- ✅ `og:description` - Description enrichie (prix, localisation, description)
- ✅ `og:image` - Image principale du produit ou avatar du vendeur
- ✅ `og:url` - URL canonique de la page
- ✅ `og:type` - Type de contenu (`product` ou `website`)
- ✅ `twitter:card` - Format de carte Twitter (`summary_large_image`)
- ✅ `twitter:title`, `twitter:description`, `twitter:image`
- ✅ `description` meta tag pour le SEO Google

### 2. **Structured Data (Schema.org)**
Ajout de données structurées JSON-LD pour les produits :
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nom du produit",
  "description": "Description complète",
  "image": ["url1", "url2"],
  "offers": {
    "@type": "Offer",
    "price": 15000,
    "priceCurrency": "XOF",
    "availability": "InStock/OutOfStock",
    "seller": {...}
  },
  "aggregateRating": {...}
}
```

## 📝 Fichiers modifiés

1. **app/product/[id].tsx**
   - Injection dynamique des meta tags OG
   - Structured data pour les produits
   - Meta description optimisée

2. **app/shop/[sellerId].tsx**
   - Injection dynamique des meta tags OG pour les boutiques
   - Meta description avec stats (nombre de produits, localisation, note)

## 🔧 Comment ça fonctionne

Les meta tags sont injectés dynamiquement via JavaScript quand la page charge :

```typescript
const updateOrCreateMeta = (property: string, content: string, isName = false) => {
  const attr = isName ? 'name' : 'property';
  let meta = document.querySelector(`meta[${attr}="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};
```

## ⚠️ Limitation importante

**Les crawlers sociaux (Facebook, WhatsApp, LinkedIn) n'exécutent PAS le JavaScript.**

Cela signifie que les meta tags injectés dynamiquement ne seront pas lus par ces crawlers. Ils ne verront que le HTML initial statique.

## 🚀 Solutions pour les Rich Previews

### Option 1 : Netlify Prerendering (Recommandé) ✨

Netlify peut pré-générer le HTML avec les meta tags. Ajoutez à `netlify.toml` :

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"

[build]
  command = "npx expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  
# Pre-rendering pour les crawlers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

Activez Prerendering dans votre dashboard Netlify :
1. Allez dans **Site Settings** > **Build & Deploy** > **Prerendering**
2. Activez "Prerender all pages"
3. Les crawlers recevront du HTML pré-généré avec les meta tags

### Option 2 : Meta Tag Service (Alternative)

Utilisez un service comme **Prerender.io** ou **Netlify Edge Functions** :

```javascript
// netlify/edge-functions/og-tags.ts
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  
  // Détecte si c'est un crawler social
  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = /facebookexternalhit|twitterbot|whatsapp/i.test(userAgent);
  
  if (isCrawler && url.pathname.startsWith("/product/")) {
    const productId = url.pathname.split("/").pop();
    
    // Fetch product data from Supabase
    // Generate HTML with proper OG tags
    
    return new Response(generatedHTML, {
      headers: { "content-type": "text/html" }
    });
  }
  
  return context.next();
};
```

### Option 3 : Améliorer le sitemap.xml

Votre `public/sitemap.xml` doit inclure tous les produits et boutiques :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Pages statiques -->
  <url>
    <loc>https://rakthiak.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Produits dynamiques -->
  <url>
    <loc>https://rakthiak.com/product/[productId]</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Boutiques -->
  <url>
    <loc>https://rakthiak.com/shop/[sellerId]</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

**Note** : Vous devriez générer ce sitemap dynamiquement pour inclure tous les produits réels.

## 🧪 Tester les Rich Previews

### Facebook Debugger
https://developers.facebook.com/tools/debug/

1. Collez l'URL de votre produit
2. Cliquez sur "Scrape Again"
3. Vérifiez les meta tags détectés

### Twitter Card Validator
https://cards-dev.twitter.com/validator

1. Collez l'URL
2. Vérifiez l'aperçu de la carte

### WhatsApp
Envoyez simplement le lien dans un chat et regardez l'aperçu

### LinkedIn Post Inspector
https://www.linkedin.com/post-inspector/

## 📊 SEO Best Practices

### Contenu dupliqué
Utilisez les canonical URLs pour éviter le contenu dupliqué :
```html
<link rel="canonical" href="https://rakthiak.com/product/123" />
```

### Temps de chargement
- ✅ Images optimisées (vous utilisez Supabase Storage)
- ✅ Lazy loading avec OptimizedImage
- ⚠️ Considérez l'ajout de Service Workers pour le cache

### Mobile-First
- ✅ Design responsive
- ✅ Touches optimisées
- ✅ Viewport configuré

### Structure des URLs
Vos URLs sont déjà SEO-friendly :
- ✅ `/product/[id]` au lieu de `/p?id=123`
- ✅ `/shop/[sellerId]` au lieu de `/s?seller=456`

## 🎯 Prochaines étapes recommandées

1. **Activer Netlify Prerendering** (solution la plus simple)
2. **Générer un sitemap dynamique** avec tous les produits
3. **Ajouter robots.txt** avec des directives appropriées (déjà fait ✅)
4. **Configurer Google Search Console**
5. **Tester avec les outils de validation** (Facebook, Twitter)
6. **Monitorer avec Google Analytics**

## 🎨 Exemple de Rich Preview

Quand quelqu'un partage ce lien sur WhatsApp :
```
https://rakthiak.com/product/abc123
```

Il verra :
```
┌─────────────────────────────────────┐
│ [Image du produit]                  │
├─────────────────────────────────────┤
│ Tablette ordinateur                 │
│ Tablette ordinateur - 15 000 FCFA  │
│ - Dakar. Tablette tactile 10        │
│ pouces, 64GB de stockage...         │
│                                     │
│ rakthiak.com                        │
└─────────────────────────────────────┘
```

## 🛠️ Maintenance

Chaque fois que vous modifiez les données d'un produit :
1. Les meta tags se mettront à jour automatiquement au chargement de la page
2. Les crawlers sociaux devront "re-scraper" l'URL
3. Utilisez Facebook Debugger pour forcer une mise à jour

## ✅ Checklist finale

- [x] Meta tags OG dynamiques ajoutés
- [x] Structured data (Schema.org) ajouté
- [x] Twitter Cards configurées
- [x] Meta descriptions optimisées
- [ ] Activer Netlify Prerendering
- [ ] Générer sitemap dynamique
- [ ] Tester avec Facebook Debugger
- [ ] Tester avec Twitter Card Validator
- [ ] Configurer Google Search Console
- [ ] Monitorer les performances SEO

---

**Note** : Les meta tags fonctionnent déjà pour les utilisateurs normaux et Google. Pour les crawlers sociaux, activez le prerendering Netlify.
