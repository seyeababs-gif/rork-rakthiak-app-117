export const IMAGE_SIZES = {
  thumbnail: 50,
  card: 400,
  detail: 800,
  full: 1200,
} as const;

export const IMAGE_QUALITY = {
  thumbnail: 30,
  low: 50,
  medium: 60,
  high: 75,
} as const;

export function getResponsiveImageUrl(
  url: string, 
  size: keyof typeof IMAGE_SIZES = 'card',
  quality: keyof typeof IMAGE_QUALITY = 'medium'
): string {
  if (!url) return url;
  
  const width = IMAGE_SIZES[size];
  const q = IMAGE_QUALITY[quality];
  
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams({
      w: width.toString(),
      q: q.toString(),
      auto: 'format',
      fm: 'webp',
      fit: 'crop',
    });
    
    return url.includes('?')
      ? `${url}&${params.toString()}`
      : `${url}?${params.toString()}`;
  }
  
  if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/')) {
    const params = new URLSearchParams({
      width: width.toString(),
      quality: q.toString(),
      format: 'webp',
    });
    
    return url.includes('?')
      ? `${url}&${params.toString()}`
      : `${url}?${params.toString()}`;
  }
  
  return url;
}

export function generateImageSrcSet(url: string): string {
  if (!url) return '';
  
  const sizes = [
    { width: 400, descriptor: '400w' },
    { width: 600, descriptor: '600w' },
    { width: 800, descriptor: '800w' },
  ];
  
  return sizes
    .map(({ width, descriptor }) => {
      const optimizedUrl = getResponsiveImageUrl(url, 'card', 'medium');
      return `${optimizedUrl} ${descriptor}`;
    })
    .join(', ');
}

const memoryCache = new Map<string, string>();
const CACHE_MAX_SIZE = 100;

export function getCachedImageUrl(url: string, size: keyof typeof IMAGE_SIZES): string {
  const cacheKey = `${url}_${size}`;
  
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  
  const optimizedUrl = getResponsiveImageUrl(url, size);
  
  if (memoryCache.size >= CACHE_MAX_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      memoryCache.delete(firstKey);
    }
  }
  
  memoryCache.set(cacheKey, optimizedUrl);
  return optimizedUrl;
}

export function clearImageCache() {
  memoryCache.clear();
}
