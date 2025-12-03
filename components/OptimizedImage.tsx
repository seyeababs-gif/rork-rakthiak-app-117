import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, ImageStyle, StyleProp, Image } from 'react-native';
import { getThumbnailUrl, getOptimizedImageUrl } from '@/lib/supabase';

interface OptimizedImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  width?: number;
}

const imageCache = new Map<string, boolean>();

export function prefetchImage(uri: string, width: number = 400) {
  if (imageCache.has(uri)) return;
  
  const optimizedUri = getOptimizedImageUrl(uri, width);
  const thumbnailUri = getThumbnailUrl(uri);
  
  Promise.all([
    Image.prefetch(thumbnailUri).catch(() => {}),
    Image.prefetch(optimizedUri).catch(() => {})
  ]).then(() => {
    imageCache.set(uri, true);
  });
}

export default function OptimizedImage({ uri, style, resizeMode = 'cover', width = 400 }: OptimizedImageProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState<boolean>(false);
  const [fullImageLoaded, setFullImageLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const thumbnailOpacity = useRef(new Animated.Value(0)).current;
  const fullImageOpacity = useRef(new Animated.Value(0)).current;
  const isMounted = useRef<boolean>(true);

  const thumbnailUri = useMemo(() => getThumbnailUrl(uri), [uri]);
  const optimizedUri = useMemo(() => getOptimizedImageUrl(uri, width), [uri, width]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (thumbnailLoaded && isMounted.current) {
      Animated.timing(thumbnailOpacity, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [thumbnailLoaded, thumbnailOpacity]);

  useEffect(() => {
    if (fullImageLoaded && isMounted.current) {
      Animated.timing(fullImageOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [fullImageLoaded, fullImageOpacity]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.placeholder, style]} />
      
      {!error && (
        <>
          <Animated.Image
            source={{ uri: thumbnailUri }}
            style={[styles.image, style, { opacity: thumbnailOpacity }]}
            resizeMode={resizeMode}
            onLoad={() => setThumbnailLoaded(true)}
            blurRadius={2}
          />
          
          <Animated.Image
            source={{ uri: optimizedUri }}
            style={[styles.image, style, { opacity: fullImageOpacity }]}
            resizeMode={resizeMode}
            onLoad={() => setFullImageLoaded(true)}
            onError={() => setError(true)}
            progressiveRenderingEnabled
          />
        </>
      )}
      
      {error && (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    width: '60%',
    height: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
});
