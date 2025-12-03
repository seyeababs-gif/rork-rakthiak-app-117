import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import OptimizedImage, { prefetchImage } from '@/components/OptimizedImage';
import ProductSkeleton from '@/components/ProductSkeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, Sparkles, Calendar, ArrowRight, Package, Car, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { categories, getSubCategoriesForCategory } from '@/constants/categories';
import { Product } from '@/types/marketplace';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

function getProductCardWidth() {
  if (width < 600) {
    const containerPadding = isWeb ? 20 : 16;
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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    currentUser,
  } = useMarketplace();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'products' | 'services'>('products');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [displayCount, setDisplayCount] = useState<number>(6);
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const isApproved = product.status === 'approved';
      const isAdmin = currentUser?.isAdmin === true;
      const isSuperAdmin = currentUser?.isSuperAdmin === true;
      const matchesSearch = searchQuery.trim() === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || product.subCategory === selectedSubCategory;
      return (isAdmin || isSuperAdmin || isApproved) && matchesSearch && matchesCategory && matchesSubCategory;
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory, currentUser]);
  
  React.useEffect(() => {
    if (viewMode === 'services') {
      const dates = new Set<string>();
      filteredProducts.forEach(product => {
        if (product.listingType === 'service' && product.serviceDetails?.departureDate) {
          const date = product.serviceDetails.departureDate.split('T')[0];
          dates.add(date);
        }
      });
      setAvailableDates(Array.from(dates).sort());
    }
  }, [filteredProducts, viewMode]);

  const sortedProducts = React.useMemo(() => {
    let sorted = [...filteredProducts];
    
    sorted = sorted.filter(product => {
      if (viewMode === 'products') {
        return product.listingType !== 'service';
      } else {
        return product.listingType === 'service';
      }
    });
    
    if (viewMode === 'services' && selectedDate) {
      sorted = sorted.filter(product => {
        if (product.listingType === 'service' && product.serviceDetails?.departureDate) {
          const productDate = product.serviceDetails.departureDate.split('T')[0];
          return productDate === selectedDate;
        }
        return false;
      });
    }
    
    return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [filteredProducts, selectedDate, viewMode]);

  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, displayCount);
  }, [sortedProducts, displayCount]);

  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }
    const nextProducts = sortedProducts.slice(displayCount, displayCount + 3);
    nextProducts.forEach(product => {
      if (product.images && product.images[0]) {
        prefetchImage(product.images[0]);
      }
    });
  }, [displayCount, sortedProducts]);

  const hasMore = displayCount < sortedProducts.length;

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 300;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMore) {
      setDisplayCount(prev => Math.min(prev + 3, sortedProducts.length));
    }
  }, [hasMore, sortedProducts.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    let dateStr: string;
    if (isToday) {
      dateStr = "Aujourd'hui";
    } else if (isTomorrow) {
      dateStr = 'Demain';
    } else {
      dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
    
    return { time: timeStr, date: dateStr };
  };

  const renderServiceCard = useCallback((product: Product) => {
    const departureDateTime = product.serviceDetails?.departureDate 
      ? formatDateTime(product.serviceDetails.departureDate) 
      : null;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.serviceCard}
        onPress={() => router.push(`/product/${product.id}` as any)}
        activeOpacity={0.9}
      >
        <View style={styles.serviceContent}>
          <OptimizedImage uri={product.sellerAvatar} style={styles.serviceAvatar} />
          
          <View style={styles.serviceDetails}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {product.title}
              </Text>
            </View>
            
            <View style={styles.serviceRoute}>
              <View style={styles.serviceLocation}>
                <MapPin size={14} color="#87CEEB" />
                <Text style={styles.locationLabel} numberOfLines={1}>
                  {product.serviceDetails?.departureLocation || product.location}
                </Text>
              </View>
              <ArrowRight size={16} color="#87CEEB" style={styles.arrowIcon} />
              <View style={styles.serviceLocation}>
                <MapPin size={14} color="#87CEEB" />
                <Text style={styles.locationLabel} numberOfLines={1}>
                  {product.serviceDetails?.arrivalLocation || 'Destination'}
                </Text>
              </View>
            </View>
            
            <View style={styles.serviceFooter}>
              <View style={styles.serviceMeta}>
                {departureDateTime && (
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.dateTimeText}>
                      {departureDateTime.date} à {departureDateTime.time}
                    </Text>
                  </View>
                )}
                <Text style={styles.sellerName} numberOfLines={1}>
                  {product.sellerName}
                </Text>
              </View>
              <Text style={styles.servicePrice}>{formatPrice(product.price)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  const renderProductCard = useCallback((product: Product) => {
    const isNew = (Date.now() - product.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    const hasDiscount = product.hasDiscount && product.discountPercent && product.discountPercent > 0;
    
    const discountedPrice = hasDiscount && product.originalPrice 
      ? product.originalPrice * (1 - (product.discountPercent || 0) / 100)
      : product.price;

    const cardWidth = getProductCardWidth();

    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { width: cardWidth }]}
        onPress={() => router.push(`/product/${product.id}` as any)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <OptimizedImage 
            uri={product.images[0]} 
            style={[styles.productImage, { height: cardWidth * 1.1 }]}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{product.discountPercent}%</Text>
            </View>
          )}
          {isNew && !hasDiscount && (
            <View style={styles.newBadge}>
              <Sparkles size={10} color="#fff" />
              <Text style={styles.newBadgeText}>Nouveau</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          {hasDiscount && product.originalPrice ? (
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPrice}>{formatPrice(discountedPrice)}</Text>
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          )}
          <View style={styles.locationRow}>
            <MapPin size={11} color="#888" />
            <Text style={styles.locationText} numberOfLines={1}>
              {product.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D2D5E', '#1E3A8A', '#2563EB', '#87CEEB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + (isWeb ? 12 : 20) }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>RAKTHIAK</Text>
            {!isWeb && <Text style={styles.headerSubtitle}>Achetez et vendez au Sénégal</Text>}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setShowSearch(!showSearch)}
              activeOpacity={0.7}
            >
              <Search size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {showSearch && (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder={viewMode === 'products' ? 'Rechercher un produit...' : 'Rechercher un service...'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.viewModeSelector}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'products' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('products')}
            activeOpacity={0.7}
          >
            <Package size={16} color={viewMode === 'products' ? '#0D2D5E' : '#fff'} />
            <Text style={[styles.viewModeText, viewMode === 'products' && styles.viewModeTextActive]}>
              Produits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'services' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('services')}
            activeOpacity={0.7}
          >
            <Car size={16} color={viewMode === 'services' ? '#0D2D5E' : '#fff'} />
            <Text style={[styles.viewModeText, viewMode === 'services' && styles.viewModeTextActive]}>
              Services
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {viewMode === 'products' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.filter(c => c.id !== 'delivery').map((category, index) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id || `category-${index}`}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubCategory(undefined);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isSelected ? category.gradient : ['#f5f5f5', '#f5f5f5']}
                  style={styles.categoryCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected
                    ]}
                  >
                    {category.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {viewMode === 'products' && selectedCategory !== 'all' && getSubCategoriesForCategory(selectedCategory).length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subCategoriesContainer}
          contentContainerStyle={styles.subCategoriesContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedSubCategory(undefined)}
            activeOpacity={0.7}
            style={[
              styles.subCategoryChip,
              !selectedSubCategory && styles.subCategoryChipSelected,
            ]}
          >
            <Text
              style={[
                styles.subCategoryText,
                !selectedSubCategory && styles.subCategoryTextSelected,
              ]}
            >
              Tous
            </Text>
          </TouchableOpacity>
          {getSubCategoriesForCategory(selectedCategory).map((subCat) => {
            const isSelected = selectedSubCategory === subCat.id;
            return (
              <TouchableOpacity
                key={subCat.id}
                onPress={() => setSelectedSubCategory(subCat.id)}
                activeOpacity={0.7}
                style={[
                  styles.subCategoryChip,
                  isSelected && styles.subCategoryChipSelected,
                ]}
              >
                <Text style={styles.subCategoryIcon}>{subCat.icon}</Text>
                <Text
                  style={[
                    styles.subCategoryText,
                    isSelected && styles.subCategoryTextSelected,
                  ]}
                >
                  {subCat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {viewMode === 'services' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subCategoriesContainer}
          contentContainerStyle={styles.subCategoriesContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedSubCategory(undefined)}
            activeOpacity={0.7}
            style={[
              styles.subCategoryChip,
              !selectedSubCategory && styles.subCategoryChipSelected,
            ]}
          >
            <Text
              style={[
                styles.subCategoryText,
                !selectedSubCategory && styles.subCategoryTextSelected,
              ]}
            >
              Tous
            </Text>
          </TouchableOpacity>
          {getSubCategoriesForCategory('delivery').map((subCat) => {
            const isSelected = selectedSubCategory === subCat.id;
            return (
              <TouchableOpacity
                key={subCat.id}
                onPress={() => setSelectedSubCategory(subCat.id)}
                activeOpacity={0.7}
                style={[
                  styles.subCategoryChip,
                  isSelected && styles.subCategoryChipSelected,
                ]}
              >
                <Text style={styles.subCategoryIcon}>{subCat.icon}</Text>
                <Text
                  style={[
                    styles.subCategoryText,
                    isSelected && styles.subCategoryTextSelected,
                  ]}
                >
                  {subCat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {viewMode === 'services' && availableDates.length > 0 && (
        <View style={styles.dateFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateFiltersContent}
          >
            <TouchableOpacity
              onPress={() => setSelectedDate(undefined)}
              activeOpacity={0.7}
              style={[
                styles.dateFilterChip,
                !selectedDate && styles.dateFilterChipSelected,
              ]}
            >
              <Calendar size={14} color={!selectedDate ? '#fff' : '#87CEEB'} />
              <Text
                style={[
                  styles.dateFilterText,
                  !selectedDate && styles.dateFilterTextSelected,
                ]}
              >
                Toutes les dates
              </Text>
            </TouchableOpacity>
            {availableDates.map((date) => {
              const isSelected = selectedDate === date;
              const dateObj = new Date(date);
              const displayDate = dateObj.toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              });
              return (
                <TouchableOpacity
                  key={date}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                  style={[
                    styles.dateFilterChip,
                    isSelected && styles.dateFilterChipSelected,
                  ]}
                >
                  <Calendar size={14} color={isSelected ? '#fff' : '#87CEEB'} />
                  <Text
                    style={[
                      styles.dateFilterText,
                      isSelected && styles.dateFilterTextSelected,
                    ]}
                  >
                    {displayDate}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.productsContainer}
        contentContainerStyle={[styles.productsContent]}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <View style={styles.productsHeader}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'services' ? 'Services disponibles' : (selectedCategory === 'all' ? 'Tous les produits' : categories.find(c => c.id === selectedCategory)?.name)}
          </Text>
          <Text style={styles.productsCount}>
            {displayedProducts.length} / {sortedProducts.length} {sortedProducts.length > 1 ? 'annonces' : 'annonce'}
          </Text>
        </View>

        {products.length === 0 && (
          <View style={styles.loadingContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductSkeleton key={`skeleton-${index}`} />
            ))}
          </View>
        )}

        {viewMode === 'services' ? (
          <View style={styles.servicesList}>
            {displayedProducts.map(renderServiceCard)}
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {displayedProducts.map(renderProductCard)}
          </View>
        )}

        {hasMore && (
          <View style={styles.loadingMore}>
            <Text style={styles.loadingMoreText}>Chargement...</Text>
          </View>
        )}

        {sortedProducts.length === 0 && products.length > 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>Aucun produit trouvé</Text>
            <Text style={styles.emptyStateSubtext}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 0,
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#fff',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  viewModeTextActive: {
    color: '#0D2D5E',
  },
  categoriesContainer: {
    maxHeight: 90,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 0.1,
  },
  categoryNameSelected: {
    color: '#fff',
  },
  subCategoriesContainer: {
    maxHeight: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subCategoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  subCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subCategoryChipSelected: {
    backgroundColor: '#0D2D5E',
    borderColor: '#0D2D5E',
  },
  subCategoryIcon: {
    fontSize: 16,
  },
  subCategoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  subCategoryTextSelected: {
    color: '#fff',
  },
  productsContainer: {
    flex: 1,
  },
  productsContent: {
    paddingHorizontal: isWeb ? 20 : 16,
    paddingTop: 16,
    paddingBottom: 100,
    alignSelf: 'center',
    width: '100%',
    maxWidth: isWeb ? 1600 : undefined,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width < 600 ? 12 : (width < 1200 ? 16 : 20),
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width < 600 ? 12 : (width < 1200 ? 16 : 20),
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f1f3',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E31B23',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  productInfo: {
    padding: 14,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
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
    fontWeight: '800' as const,
    color: '#0D2D5E',
    letterSpacing: -0.3,
  },
  discountedPrice: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#E31B23',
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
  },
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
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dateFilterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateFiltersContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dateFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#87CEEB',
  },
  dateFilterChipSelected: {
    backgroundColor: '#87CEEB',
    borderColor: '#87CEEB',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#87CEEB',
  },
  dateFilterTextSelected: {
    color: '#fff',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    resizeMode: 'cover' as const,
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
    fontWeight: '700' as const,
    color: '#1a1a1a',
    flex: 1,
  },
  serviceRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  serviceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  arrowIcon: {
    flexShrink: 0,
  },
  locationLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500' as const,
    flex: 1,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  serviceMeta: {
    flex: 1,
    gap: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#87CEEB',
    fontWeight: '700' as const,
  },
  sellerName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500' as const,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#87CEEB',
    letterSpacing: -0.3,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
});
