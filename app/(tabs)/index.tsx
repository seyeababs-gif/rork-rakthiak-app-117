import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Search, MapPin, Heart, SlidersHorizontal, TrendingUp, Sparkles, Calendar, ArrowRight, Package, Car } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { categories, getSubCategoriesForCategory } from '@/constants/categories';
import { Product } from '@/types/marketplace';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    toggleFavorite,
    isFavorite,
    isAuthenticated,
  } = useMarketplace();
  
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'products' | 'services'>('products');
  
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
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'recent':
      default:
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }, [filteredProducts, sortBy, selectedDate, viewMode]);

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

  const renderServiceCard = (product: Product) => {
    const favorite = isFavorite(product.id);
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
          <Image source={{ uri: product.sellerAvatar }} style={styles.serviceAvatar} />
          
          <View style={styles.serviceDetails}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    router.push('/auth/login');
                    return;
                  }
                  toggleFavorite(product.id);
                }}
                activeOpacity={0.8}
              >
                <Heart
                  size={20}
                  color={favorite ? '#E31B23' : '#87CEEB'}
                  fill={favorite ? '#E31B23' : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
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
  };

  const renderProductCard = (product: Product) => {
    const favorite = isFavorite(product.id);
    const isNew = (Date.now() - product.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
    const hasDiscount = product.hasDiscount && product.discountPercent && product.discountPercent > 0;
    
    const discountedPrice = hasDiscount && product.originalPrice 
      ? product.originalPrice * (1 - (product.discountPercent || 0) / 100)
      : product.price;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => router.push(`/product/${product.id}` as any)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
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
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                router.push('/auth/login');
                return;
              }
              toggleFavorite(product.id);
            }}
            activeOpacity={0.8}
          >
            <Heart
              size={18}
              color={favorite ? '#E31B23' : '#fff'}
              fill={favorite ? '#E31B23' : 'transparent'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
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
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D2D5E', '#1E3A8A', '#2563EB', '#87CEEB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>RAKTHIAK</Text>
            <Text style={styles.headerSubtitle}>Achetez et vendez au Sénégal</Text>
          </View>
          <View style={styles.trendingBadge}>
            <TrendingUp size={14} color="#0D2D5E" />
            <Text style={styles.trendingText}>{filteredProducts.length}</Text>
          </View>
        </View>
        
        <View style={styles.viewModeSelector}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'products' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('products')}
            activeOpacity={0.7}
          >
            <Package size={18} color={viewMode === 'products' ? '#0D2D5E' : '#fff'} />
            <Text style={[styles.viewModeText, viewMode === 'products' && styles.viewModeTextActive]}>
              Produits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'services' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('services')}
            activeOpacity={0.7}
          >
            <Car size={18} color={viewMode === 'services' ? '#0D2D5E' : '#fff'} />
            <Text style={[styles.viewModeText, viewMode === 'services' && styles.viewModeTextActive]}>
              Services
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={viewMode === 'products' ? 'Rechercher un produit...' : 'Rechercher un service...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} color={showFilters ? '#0D2D5E' : '#87CEEB'} />
          </TouchableOpacity>
        </View>
        
        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterLabel}>Trier par:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
                onPress={() => setSortBy('recent')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
                  Plus récent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'price-low' && styles.sortButtonActive]}
                onPress={() => setSortBy('price-low')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'price-low' && styles.sortButtonTextActive]}>
                  Prix croissant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'price-high' && styles.sortButtonActive]}
                onPress={() => setSortBy('price-high')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'price-high' && styles.sortButtonTextActive]}>
                  Prix décroissant
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

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
                      isSelected && styles.categoryNameSelected,
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
        style={styles.productsContainer}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productsHeader}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'services' ? 'Services disponibles' : (selectedCategory === 'all' ? 'Tous les produits' : categories.find(c => c.id === selectedCategory)?.name)}
          </Text>
          <Text style={styles.productsCount}>
            {sortedProducts.length} {sortedProducts.length > 1 ? 'annonces' : 'annonce'}
          </Text>
        </View>

        {viewMode === 'services' ? (
          <View style={styles.servicesList}>
            {sortedProducts.map(renderServiceCard)}
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {sortedProducts.map(renderProductCard)}
          </View>
        )}

        {sortedProducts.length === 0 && (
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
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as const,
  },
  trendingBadge: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0D2D5E',
  },
  viewModeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#fff',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  viewModeTextActive: {
    color: '#0D2D5E',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e8e9eb',
  },
  filterButton: {
    padding: 4,
  },
  filtersPanel: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortButtonActive: {
    backgroundColor: '#0D2D5E',
    borderColor: '#0D2D5E',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoriesContainer: {
    maxHeight: 100,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 0.2,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
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
    gap: 16,
  },
  productCard: {
    width: CARD_WIDTH,
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
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
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
  metaText: {
    fontSize: 12,
    color: '#87CEEB',
    fontWeight: '600' as const,
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
});
