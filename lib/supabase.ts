import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yhdexpkqtfxmhcpcydcm.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGV4cGtxdGZ4bWhjcGN5ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODU3ODEsImV4cCI6MjA3OTI2MTc4MX0.GGUwjQmKOHeK0UgmF4eDndfGnnpRcnUFDOc535ZaA_g';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  }
  return AsyncStorage as any;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'marketplace-app',
    },
  },
});

export async function compressImage(uri: string, maxWidth: number = 800): Promise<string> {
  try {
    console.log('[COMPRESSION] Starting image compression...');
    console.log('[COMPRESSION] Original URI:', uri);
    
    if (Platform.OS === 'web') {
      return await compressImageWeb(uri, maxWidth, 0.6);
    }
    
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: 0.6, format: SaveFormat.JPEG }
    );
    
    console.log('[COMPRESSION] Compressed URI:', manipResult.uri);
    console.log('[COMPRESSION] Compression successful');
    
    return manipResult.uri;
  } catch (error) {
    console.error('[COMPRESSION] Image compression error:', error);
    return uri;
  }
}

export async function createThumbnail(uri: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      return await compressImageWeb(uri, 200, 0.5);
    }
    
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 200 } }],
      { compress: 0.5, format: SaveFormat.JPEG }
    );
    
    return manipResult.uri;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return uri;
  }
}

async function compressImageWeb(uri: string, maxWidth: number, quality: number): Promise<string> {
  console.log('[COMPRESSION WEB] Starting web compression...');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(uri);
        return;
      }
      
      const ratio = img.width / img.height;
      const width = Math.min(maxWidth, img.width);
      const height = width / ratio;
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.log('[COMPRESSION WEB] Blob creation failed');
            resolve(uri);
            return;
          }
          
          console.log('[COMPRESSION WEB] Blob size:', (blob.size / 1024).toFixed(2), 'KB');
          
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('[COMPRESSION WEB] Compression successful');
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            console.log('[COMPRESSION WEB] FileReader error');
            resolve(uri);
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => resolve(uri);
    img.src = uri;
  });
}

export function getOptimizedImageUrl(url: string, width: number = 400): string {
  if (!url) return url;
  
  if (url.includes('unsplash.com')) {
    const optimizedWidth = Math.min(width, 600);
    const optimizedUrl = url.includes('?')
      ? `${url}&w=${optimizedWidth}&q=60&auto=format&fm=webp&fit=crop`
      : `${url}?w=${optimizedWidth}&q=60&auto=format&fm=webp&fit=crop`;
    return optimizedUrl;
  }
  
  return url;
}

export function getThumbnailUrl(url: string): string {
  if (!url) return url;
  
  if (url.includes('unsplash.com')) {
    const thumbnailUrl = url.includes('?')
      ? `${url}&w=50&q=30&blur=20&fm=webp`
      : `${url}?w=50&q=30&blur=20&fm=webp`;
    return thumbnailUrl;
  }
  
  return url;
}

export async function uploadImageToStorage(uri: string): Promise<string> {
  try {
    console.log('Starting image upload to Supabase Storage...');
    
    let blob: Blob;
    
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      blob = await response.blob();
    } else {
      const response = await fetch(uri);
      blob = await response.blob();
    }
    
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    console.log('Uploading image to:', filePath);
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}
