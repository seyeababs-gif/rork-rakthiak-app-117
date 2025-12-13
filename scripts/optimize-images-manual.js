/**
 * 🎯 Script d'Optimisation des Images Existantes
 * 
 * ⚠️  CE SCRIPT DOIT ÊTRE LANCÉ SUR TON ORDINATEUR PERSONNEL, PAS DANS RORK
 * 
 * Instructions:
 * 1. Copie ce fichier sur ton ordinateur
 * 2. Installe les dépendances: npm install sharp @supabase/supabase-js
 * 3. Remplace SUPABASE_SERVICE_ROLE_KEY par ta vraie clé
 * 4. Lance: node optimize-images-manual.js
 */

/* eslint-disable no-undef */
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const https = require('https');

const supabaseUrl = 'https://yhdexpkqtfxmhcpcydcm.supabase.co';
const supabaseServiceKey = 'SUPABASE_SERVICE_ROLE_KEY'; // ⚠️ REMPLACE ICI

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, (res) => {
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function optimizeImages() {
  console.log('🚀 Début de l\'optimisation...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, images, title');

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`📦 ${products.length} produits trouvés\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let optimizedCount = 0;

  for (const product of products) {
    if (!product.images?.length) continue;

    const storageImages = product.images.filter(img => 
      img.includes('supabase.co') && img.includes('/storage/v1/object/public/')
    );

    if (!storageImages.length) continue;

    console.log(`🔄 ${product.title}: ${storageImages.length} image(s)`);

    const newImages = [];

    for (let i = 0; i < product.images.length; i++) {
      const imageUrl = product.images[i];

      if (!imageUrl.includes('supabase.co') || !imageUrl.includes('/storage/v1/object/public/')) {
        newImages.push(imageUrl);
        continue;
      }

      try {
        const buffer = await downloadImage(imageUrl);
        totalBefore += buffer.length;

        const compressed = await sharp(buffer)
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 70, 
            progressive: true 
          })
          .toBuffer();

        totalAfter += compressed.length;

        const fileName = `opt-${product.id}-${i}-${Date.now()}.jpg`;
        const filePath = `products/${fileName}`;

        await supabase.storage
          .from('product-images')
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
            cacheControl: '31536000'
          });

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(data.publicUrl);
        optimizedCount++;

        const reduction = ((buffer.length - compressed.length) / buffer.length * 100).toFixed(1);
        console.log(`   ✅ Image ${i + 1}: ${(buffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (-${reduction}%)`);
      } catch (err) {
        console.error(`   ❌ Erreur image ${i}:`, err.message);
        newImages.push(imageUrl);
      }
    }

    await supabase
      .from('products')
      .update({ images: newImages })
      .eq('id', product.id);

    console.log(`✅ Produit mis à jour\n`);
  }

  const totalReduction = ((totalBefore - totalAfter) / totalBefore * 100).toFixed(1);
  console.log('📊 Résumé:');
  console.log(`   ✅ Images optimisées: ${optimizedCount}`);
  console.log(`   📦 Avant: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   📦 Après: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   💾 Économie: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (-${totalReduction}%)`);
  console.log('\n🎉 Terminé !');
}

optimizeImages().catch(console.error);
