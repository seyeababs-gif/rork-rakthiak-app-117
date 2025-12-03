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
    if (Platform.OS === 'web') {
      return await compressImageWeb(uri, maxWidth, 0.7);
    }
    
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    
    return manipResult.uri;
  } catch (error) {
    console.error('Image compression error:', error);
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
            resolve(uri);
            return;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(uri);
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
    const optimizedUrl = url.includes('?')
      ? `${url}&w=${Math.min(width, 800)}&q=75&auto=format&fm=webp&fit=crop`
      : `${url}?w=${Math.min(width, 800)}&q=75&auto=format&fm=webp&fit=crop`;
    return optimizedUrl;
  }
  
  if (url.includes(supabaseUrl) && url.includes('/storage/v1/object/public/')) {
    const optimizedUrl = url.includes('?')
      ? `${url}&width=${width}&quality=75`
      : `${url}?width=${width}&quality=75`;
    return optimizedUrl;
  }
  
  return url;
}

export function getThumbnailUrl(url: string): string {
  if (!url) return url;
  
  if (url.includes('unsplash.com')) {
    const thumbnailUrl = url.includes('?')
      ? `${url}&w=20&q=10&blur=30`
      : `${url}?w=20&q=10&blur=30`;
    return thumbnailUrl;
  }
  
  if (url.includes(supabaseUrl) && url.includes('/storage/v1/object/public/')) {
    const thumbnailUrl = url.includes('?')
      ? `${url}&width=20&quality=10`
      : `${url}?width=20&quality=10`;
    return thumbnailUrl;
  }
  
  return url;
}
