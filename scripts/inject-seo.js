/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

const seoTags = `
  <!-- Primary Meta Tags -->
  <title>RAKTHIAK - Marketplace #1 au Sénégal | Achat & Vente en Ligne</title>
  <meta name="title" content="RAKTHIAK - Marketplace #1 au Sénégal | Achat & Vente en Ligne" />
  <meta name="description" content="Achetez et vendez facilement au Sénégal sur RAKTHIAK. Des milliers de produits : Mode, Électronique, Maison, Beauté. Livraison rapide à Dakar et dans tout le Sénégal. Paiement sécurisé Wave, Orange Money, Free Money." />
  <meta name="keywords" content="marketplace sénégal, achat en ligne sénégal, vente en ligne dakar, e-commerce sénégal, rakthiak, produits sénégal, livraison dakar" />
  <meta name="author" content="RAKTHIAK" />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="French" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://rakthiak.com/" />
  <meta property="og:site_name" content="RAKTHIAK" />
  <meta property="og:title" content="RAKTHIAK - Marketplace #1 au Sénégal" />
  <meta property="og:description" content="Achetez et vendez facilement au Sénégal. Des milliers de produits : Mode, Électronique, Maison, Beauté. Livraison rapide, paiement sécurisé Wave." />
  <meta property="og:image" content="https://rakthiak.com/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="fr_SN" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://rakthiak.com/" />
  <meta property="twitter:title" content="RAKTHIAK - Marketplace #1 au Sénégal" />
  <meta property="twitter:description" content="Achetez et vendez facilement au Sénégal. Des milliers de produits : Mode, Électronique, Maison, Beauté." />
  <meta property="twitter:image" content="https://rakthiak.com/og-image.jpg" />
  
  <!-- Geo Tags -->
  <meta name="geo.region" content="SN" />
  <meta name="geo.placename" content="Dakar" />
  
  <!-- Canonical -->
  <link rel="canonical" href="https://rakthiak.com/" />
  
  <!-- Structured Data - Organization -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RAKTHIAK",
    "url": "https://rakthiak.com",
    "logo": "https://rakthiak.com/icon.png",
    "description": "Marketplace leader au Sénégal pour l'achat et la vente en ligne",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "SN",
      "addressLocality": "Dakar"
    }
  }
  </script>
  
  <!-- Structured Data - WebSite -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "RAKTHIAK",
    "url": "https://rakthiak.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://rakthiak.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
`;

const noscriptContent = `
  <noscript>
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: #fff; padding: 20px; text-align: center;">
      <div style="max-width: 500px;">
        <h1 style="color: #8B5CF6; font-size: 24px; margin-bottom: 16px;">RAKTHIAK Marketplace</h1>
        <p style="color: #666; line-height: 1.6;">Achetez et vendez facilement au Sénégal. Des milliers de produits disponibles : Mode, Électronique, Maison, Beauté et plus encore.</p>
        <p style="color: #666; line-height: 1.6; margin-top: 12px;">Livraison rapide à Dakar et dans tout le Sénégal. Paiement sécurisé avec Wave, Orange Money et Free Money.</p>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">JavaScript doit être activé pour utiliser l'application.</p>
      </div>
    </div>
  </noscript>
`;

try {
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html not found. Build may have failed.');
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');
  
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + seoTags);
  } else {
    console.error('❌ <head> tag not found in index.html');
    process.exit(1);
  }
  
  if (html.includes('<body>')) {
    html = html.replace('<body>', '<body>' + noscriptContent);
  }
  
  const titleMatch = html.match(/<title>.*?<\/title>/);
  if (titleMatch && !titleMatch[0].includes('RAKTHIAK')) {
    html = html.replace(/<title>.*?<\/title>/, '<title>RAKTHIAK - Marketplace #1 au Sénégal</title>');
  }
  
  fs.writeFileSync(indexPath, html);
  
  console.log('✅ SEO tags injected successfully into dist/index.html');
  console.log('✅ Noscript fallback added');
  console.log('✅ Title updated');
  
} catch (error) {
  console.error('❌ Failed to inject SEO tags:', error);
  process.exit(1);
}
