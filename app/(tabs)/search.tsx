import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, MapPin, Heart, Sparkles, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { Product } from '@/types/marketplace';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

function getProductCardWidth() {
  if (width < 600) {
    const containerPadding = 16;
    const gap = 12;
    const columns = 2;
    const availableWidth = width - (containerPadding * 2);
    const totalGapWidth = gap * (columns - 1);
    return (availableWidth - totalGapWidth) / columns;
  } else if (width < 900) {
    return (width - 80) / 3;
  } else if (width < 1200) {
    return (width - 120) / 4;
  } else if (width < 1600) {
    const containerWidth = Math.min(width, 1600);
    return (containerWidth - 160) / 5;
  } else {
    return (1600 - 160) / 6;
  }
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, toggleFavorite, isFavorite, isAuthenticated } = useMarketplace();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    return products.filter(product => {
      const isApproved = product.status === 'approved';
      const matchesSearch = product.title.toLowerCase().includes(lowerQuery) ||
                          product.description.toLowerCase().includes(lowerQuery) ||
                          product.category.toLowerCase().includes(lowerQuery) ||
                          product.location.toLowerCase().includes(lowerQuery);
      
      return isApproved && matchesSearch;
    });
  }, [products, query]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };
  };

  const renderItem = (item: Product) => {
    const favorite = isFavorite(item.id);

    if (item.listingType === 'service') {
       const departureDateTime = item.serviceDetails?.departureDate 
          ? formatDateTime(item.serviceDetails.departureDate) 
          : null;

      return (
        <TouchableOpacity
          key={item.id}
          style={styles.serviceCard}
          onPress={() => router.push(`/product/${item.id}` as any)}
          activeOpacity={0.9}
        >
          <View style={styles.serviceContent}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.serviceAvatar} />
            <View style={styles.serviceDetails}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      router.push('/auth/login');
                      return;
                    }
                    toggleFavorite(item.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Heart
                    size={20}
                    color={favorite ? '#E31B23' : '#87CEEB'}
                    fill={favorite ? '#E31B23' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.serviceRoute}>
                <Text style={styles.locationLabel} numberOfLines={1}>
                  {item.serviceDetails?.departureLocation || item.location}
                </Text>
                <ArrowRight size={14} color="#87CEEB" />
                <Text style={styles.locationLabel} numberOfLines={1}>
                  {item.serviceDetails?.arrivalLocation || 'Destination'}
                </Text>
              </View>
              
              <View style={styles.serviceFooter}>
                <Text style={styles.servicePrice}>{formatPrice(item.price)}</Text>
                {departureDateTime && (
                  <Text style={styles.dateTimeText}>
                    {departureDateTime.date} • {departureDateTime.time}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Product Card
    const isNew = (Date.now() - item.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    const hasDiscount = item.hasDiscount && item.discountPercent && item.discountPercent > 0;
    const discountedPrice = hasDiscount && item.originalPrice 
      ? item.originalPrice * (1 - (item.discountPercent || 0) / 100)
      : item.price;

    const cardWidth = getProductCardWidth();

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.productCard, { width: cardWidth }]}
        onPress={() => router.push(`/product/${item.id}` as any)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.images[0] }} style={[styles.productImage, { height: cardWidth * 1.1 }]} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{item.discountPercent}%</Text>
            </View>
          )}
          {isNew && !hasDiscount && (
            <View style={styles.newBadge}>
              <Sparkles size={10} color="#fff" />
              <Text style={styles.newBadgeText}>Nouveau</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                router.push('/auth/login');
                return;
              }
              toggleFavorite(item.id);
            }}
          >
            <Heart
              size={18}
              color={favorite ? '#E31B23' : '#fff'}
              fill={favorite ? '#E31B23' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
          {hasDiscount && item.originalPrice ? (
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPrice}>{formatPrice(discountedPrice)}</Text>
              <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          )}
          <View style={styles.locationRow}>
            <MapPin size={11} color="#888" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>Recherche</Text>
          <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
            <SearchIcon size={20} color={isFocused ? '#0D2D5E' : '#666'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit, service..."
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholderTextColor="#999"
              autoFocus={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              {query.trim().length === 0 ? (
                <>
                  <Text style={styles.emptyStateIcon}>🔍</Text>
                  <Text style={styles.emptyStateText}>Commencez votre recherche</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Trouvez des produits, services, et plus encore
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyStateIcon}>😕</Text>
                  <Text style={styles.emptyStateText}>Aucun résultat</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Essayez d&apos;autres mots-clés ou vérifiez l&apos;orthographe
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {filteredItems.map(renderItem)}
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D2D5E',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e8e9eb',
  },
  searchBarFocused: {
    borderColor: '#0D2D5E',
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: isWeb ? 20 : 16,
    paddingTop: 16,
    paddingBottom: 100,
    alignSelf: 'center',
    width: '100%',
    maxWidth: isWeb ? 1600 : undefined,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width < 600 ? 12 : (width < 1200 ? 16 : 20),
    justifyContent: 'flex-start',
  },
  // Product Card Styles
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f1f3',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    resizeMode: 'cover' as const,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E31B23',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  productInfo: {
    padding: 14,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    height: 36,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D2D5E',
  },
  discountedPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E31B23',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 11,
    color: '#888',
    flex: 1,
    fontWeight: '500',
  },
  
  // Service Card Styles
  serviceCard: {
    width: '100%', // Full width for services
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f1f3',
  },
  serviceContent: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  serviceRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#87CEEB',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#888',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
});