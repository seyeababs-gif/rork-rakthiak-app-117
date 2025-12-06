import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yhdexpkqtfxmhcpcydcm.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGV4cGtxdGZ4bWhjcGN5ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODU3ODEsImV4cCI6MjA3OTI2MTc4MX0.GGUwjQmKOHeK0UgmF4eDndfGnnpRcnUFDOc535ZaA_g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateBase64ImagesToStorage() {
  console.log('🚀 Début de la migration des images Base64 vers Supabase Storage...');
  
  try {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, images, title');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des produits:', fetchError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('✅ Aucun produit à migrer');
      return;
    }

    console.log(`📦 ${products.length} produits trouvés`);
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        if (!product.images || product.images.length === 0) {
          console.log(`⏭️  Produit ${product.id}: Aucune image`);
          skippedCount++;
          continue;
        }

        const base64Images = product.images.filter((img: string) => 
          img.startsWith('data:image/')
        );

        if (base64Images.length === 0) {
          console.log(`⏭️  Produit ${product.id} (${product.title}): Déjà migré ou utilise des URLs`);
          skippedCount++;
          continue;
        }

        console.log(`🔄 Migration de ${base64Images.length} image(s) pour "${product.title}"...`);

        const newImageUrls: string[] = [];

        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          
          if (!image.startsWith('data:image/')) {
            newImageUrls.push(image);
            continue;
          }

          try {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const fileExt = mimeType.split('/')[1];

            const buffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([buffer], { type: mimeType });

            const fileName = `${product.id}-${i}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, blob, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error(`   ❌ Erreur upload image ${i}:`, uploadError.message);
              newImageUrls.push(image);
              continue;
            }

            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;
            newImageUrls.push(publicUrl);
            
            console.log(`   ✅ Image ${i + 1}/${product.images.length} uploadée`);
          } catch (imageError: any) {
            console.error(`   ❌ Erreur lors du traitement de l'image ${i}:`, imageError.message);
            newImageUrls.push(image);
          }
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ images: newImageUrls })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Erreur mise à jour produit ${product.id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Produit "${product.title}" migré avec succès`);
          migratedCount++;
        }

      } catch (productError: any) {
        console.error(`❌ Erreur pour le produit ${product.id}:`, productError.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Produits migrés: ${migratedCount}`);
    console.log(`   ⏭️  Produits ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total: ${products.length}`);
    console.log('\n🎉 Migration terminée !');

  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message);
  }
}

if (require.main === module) {
  migrateBase64ImagesToStorage().then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
}

export default migrateBase64ImagesToStorage;
