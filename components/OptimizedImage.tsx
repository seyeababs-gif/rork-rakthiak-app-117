import React, { useState } from 'react';
import { Image, View, StyleSheet, ActivityIndicator, ImageStyle, StyleProp } from 'react-native';

interface OptimizedImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export default function OptimizedImage({ uri, style, resizeMode = 'cover' }: OptimizedImageProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  return (
    <View style={[styles.container, style]}>
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0D2D5E" />
        </View>
      )}
      
      {error ? (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorPlaceholder} />
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          progressiveRenderingEnabled
          fadeDuration={200}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
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
