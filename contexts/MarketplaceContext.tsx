import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Product, Category, User, UserType, Review, ProductStatus, SubCategory, ListingType } from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/contexts/ToastContext';

export const [MarketplaceProvider, useMarketplace] = createContextHook(() => {
  const notifications = useNotifications();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadUser();
    loadProducts();
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [currentUser]);

  const loadUser = async () => {
    try {
      let storedUserId: string | null = null;
      if (Platform.OS === 'web') {
        storedUserId = localStorage.getItem('currentUserId');
      } else {
        storedUserId = await AsyncStorage.getItem('currentUserId');
      }
      if (storedUserId) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', storedUserId)
          .single();
        
        if (error || !userData) {
          console.error('Error loading user from Supabase:', error);
          if (Platform.OS === 'web') {
            localStorage.removeItem('currentUserId');
          } else {
            await AsyncStorage.removeItem('currentUserId');
          }
          setCurrentUser(null);
          setIsAuthenticated(false);
          return;
        }

        const user: User = {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar,
          phone: userData.phone,
          password: userData.password,
          location: userData.location,
          type: userData.type as UserType,
          isAdmin: userData.is_admin,
          isSuperAdmin: userData.is_super_admin,
          email: userData.email,
          bio: userData.bio,
          rating: userData.rating,
          reviewCount: userData.review_count,
          joinedDate: userData.joined_date ? new Date(userData.joined_date) : undefined,
          premiumPaymentPending: userData.premium_payment_pending,
          premiumRequestDate: userData.premium_request_date ? new Date(userData.premium_request_date) : undefined,
          deliveryAddress: userData.delivery_address,
          deliveryCity: userData.delivery_city,
          deliveryPhone: userData.delivery_phone,
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const loadProducts = async () => {
    try {
      const cachedProducts = Platform.OS === 'web' 
        ? localStorage.getItem('cached_products')
        : await AsyncStorage.getItem('cached_products');
      
      const cachedTimestamp = Platform.OS === 'web'
        ? localStorage.getItem('cached_products_timestamp')
        : await AsyncStorage.getItem('cached_products_timestamp');
      
      const now = Date.now();
      const cacheAge = cachedTimestamp ? now - parseInt(cachedTimestamp, 10) : Infinity;
      const MAX_CACHE_AGE = 5 * 60 * 1000;
      
      if (cachedProducts && cacheAge < MAX_CACHE_AGE) {
        try {
          const parsed = JSON.parse(cachedProducts);
          const mappedFromCache: Product[] = parsed.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            approvedAt: p.approvedAt ? new Date(p.approvedAt) : undefined,
            rejectedAt: p.rejectedAt ? new Date(p.rejectedAt) : undefined,
          }));
          setProducts(mappedFromCache);
        } catch (e) {
          console.error('Error parsing cached products:', e);
        }
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading products:', error.message || error);
        throw new Error(error.message || 'Failed to load products');
      }

      if (data) {
        const mappedProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: parseFloat(p.price),
          images: p.images,
          category: p.category as Category,
          subCategory: p.sub_category as SubCategory | undefined,
          location: p.location,
          sellerId: p.seller_id,
          sellerName: p.seller_name,
          sellerAvatar: p.seller_avatar,
          sellerPhone: p.seller_phone,
          createdAt: new Date(p.created_at),
          condition: p.condition,
          status: p.status as ProductStatus,
          rejectionReason: p.rejection_reason,
          approvedAt: p.approved_at ? new Date(p.approved_at) : undefined,
          rejectedAt: p.rejected_at ? new Date(p.rejected_at) : undefined,
          approvedBy: p.approved_by,
          averageRating: p.average_rating,
          reviewCount: p.review_count,
          listingType: p.listing_type as ListingType,
          serviceDetails: p.service_details,
          stockQuantity: p.stock_quantity,
          isOutOfStock: p.is_out_of_stock,
          hasDiscount: p.has_discount,
          discountPercent: p.discount_percent,
          originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
        }));
        setProducts(mappedProducts);

        const cacheData = JSON.stringify(mappedProducts);
        const timestamp = Date.now().toString();
        
        if (Platform.OS === 'web') {
          try {
            localStorage.setItem('cached_products', cacheData);
            localStorage.setItem('cached_products_timestamp', timestamp);
          } catch (e) {
            console.error('Error caching products:', e);
            try {
              localStorage.removeItem('cached_products');
              localStorage.removeItem('cached_products_timestamp');
            } catch (clearError) {
              console.error('Error clearing cache:', clearError);
            }
          }
        } else {
          try {
            await AsyncStorage.multiSet([
              ['cached_products', cacheData],
              ['cached_products_timestamp', timestamp]
            ]);
          } catch (e) {
            console.error('Error caching products:', e);
            try {
              await AsyncStorage.multiRemove(['cached_products', 'cached_products_timestamp']);
            } catch (clearError) {
              console.error('Error clearing cache:', clearError);
            }
          }
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('Error loading products:', errorMsg);
      toast.showError('Error loading products: ' + errorMsg);
    }
  };

  const loadFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }
      
      if (data) {
        setFavorites(data.map((f: any) => f.product_id));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };



  const toggleFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated || !currentUser) {
      return;
    }
    
    try {
      const isFav = favorites.includes(productId);
      
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
        
        if (error) {
          console.error('Error removing favorite:', error);
          return;
        }
        
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: currentUser.id,
            product_id: productId,
          }]);
        
        if (error) {
          console.error('Error adding favorite:', error);
          return;
        }
        
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [favorites, isAuthenticated, currentUser]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const isApproved = product.status === 'approved';
      const isAdmin = currentUser?.isAdmin === true;
      const isSuperAdmin = currentUser?.isSuperAdmin === true;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || product.subCategory === selectedSubCategory;
      return (isAdmin || isSuperAdmin || isApproved) && matchesSearch && matchesCategory && matchesSubCategory;
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory, currentUser]);

  const favoriteProducts = useMemo(() => {
    return products.filter(product => favorites.includes(product.id));
  }, [products, favorites]);

  const userProducts = useMemo(() => {
    if (!currentUser) return [];
    return products.filter(product => product.sellerId === currentUser.id);
  }, [products, currentUser]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'status'>) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    
    try {
      const newProductData = {
        id: `product-${Date.now()}`,
        title: product.title,
        description: product.description,
        price: product.price,
        images: product.images,
        category: product.category,
        sub_category: product.subCategory,
        location: product.location,
        seller_id: currentUser.id,
        seller_name: currentUser.name,
        seller_avatar: currentUser.avatar,
        seller_phone: currentUser.phone,
        condition: product.condition,
        status: 'pending',
        listing_type: product.listingType || 'product',
        service_details: product.serviceDetails,
        stock_quantity: product.stockQuantity,
        is_out_of_stock: product.listingType === 'product' ? false : undefined,
        has_discount: product.hasDiscount,
        discount_percent: product.discountPercent,
        original_price: product.originalPrice,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProductData])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        return { success: false, error: error.message };
      }

      if (data) {
        const newProduct: Product = {
          id: data.id,
          title: data.title,
          description: data.description,
          price: parseFloat(data.price),
          images: data.images,
          category: data.category as Category,
          subCategory: data.sub_category as SubCategory | undefined,
          location: data.location,
          sellerId: data.seller_id,
          sellerName: data.seller_name,
          sellerAvatar: data.seller_avatar,
          sellerPhone: data.seller_phone,
          createdAt: new Date(data.created_at),
          condition: data.condition,
          status: data.status as ProductStatus,
          listingType: data.listing_type as ListingType,
          serviceDetails: data.service_details,
          stockQuantity: data.stock_quantity,
          isOutOfStock: data.is_out_of_stock,
          hasDiscount: data.has_discount,
          discountPercent: data.discount_percent,
          originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
        };
        setProducts([newProduct, ...products]);

        await notifications.sendNotificationToAdmins({
          type: 'product_published',
          title: 'Nouvelle annonce publiée',
          message: `${currentUser.name} a publié une nouvelle annonce: ${product.title}`,
          data: { productId: data.id, sellerId: currentUser.id },
        });

        return { success: true, product: newProduct };
      }
      return { success: false, error: 'No data returned' };
    } catch (error: any) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message || String(error) };
    }
  }, [currentUser, products, notifications]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        console.error('Product not found');
        return;
      }

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subCategory !== undefined) updateData.sub_category = updates.subCategory;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.condition !== undefined) updateData.condition = updates.condition;
      
      if (currentUser?.type === 'premium') {
        if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity;
        if (updates.isOutOfStock !== undefined) updateData.is_out_of_stock = updates.isOutOfStock;
        if (updates.hasDiscount !== undefined) updateData.has_discount = updates.hasDiscount;
        if (updates.discountPercent !== undefined) updateData.discount_percent = updates.discountPercent;
        if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice;
      } else {
        if (product.stockQuantity !== undefined && updates.stockQuantity !== undefined) {
          updateData.stock_quantity = updates.stockQuantity;
        }
        if (product.isOutOfStock !== undefined && updates.isOutOfStock !== undefined) {
          updateData.is_out_of_stock = updates.isOutOfStock;
        }
        if (product.hasDiscount && updates.hasDiscount !== undefined) {
          updateData.has_discount = updates.hasDiscount;
        }
        if (product.hasDiscount && updates.discountPercent !== undefined) {
          updateData.discount_percent = updates.discountPercent;
        }
        if (product.hasDiscount && updates.originalPrice !== undefined) {
          updateData.original_price = updates.originalPrice;
        }
      }
      
      if (updates.serviceDetails !== undefined) updateData.service_details = updates.serviceDetails;
      if (updates.listingType !== undefined) updateData.listing_type = updates.listingType;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      const finalUpdates: Partial<Product> = {};
      if (updateData.title !== undefined) finalUpdates.title = updateData.title;
      if (updateData.description !== undefined) finalUpdates.description = updateData.description;
      if (updateData.price !== undefined) finalUpdates.price = updateData.price;
      if (updateData.images !== undefined) finalUpdates.images = updateData.images;
      if (updateData.category !== undefined) finalUpdates.category = updateData.category as Category;
      if (updateData.sub_category !== undefined) finalUpdates.subCategory = updateData.sub_category;
      if (updateData.location !== undefined) finalUpdates.location = updateData.location;
      if (updateData.condition !== undefined) finalUpdates.condition = updateData.condition;
      if (updateData.stock_quantity !== undefined) finalUpdates.stockQuantity = updateData.stock_quantity;
      if (updateData.is_out_of_stock !== undefined) finalUpdates.isOutOfStock = updateData.is_out_of_stock;
      if (updateData.has_discount !== undefined) finalUpdates.hasDiscount = updateData.has_discount;
      if (updateData.discount_percent !== undefined) finalUpdates.discountPercent = updateData.discount_percent;
      if (updateData.original_price !== undefined) finalUpdates.originalPrice = updateData.original_price;
      if (updateData.service_details !== undefined) finalUpdates.serviceDetails = updateData.service_details;
      if (updateData.listing_type !== undefined) finalUpdates.listingType = updateData.listing_type as ListingType;

      setProducts(products.map(p => p.id === productId ? { ...p, ...finalUpdates } : p));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }, [products, currentUser]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return;
      }

      setProducts(products.filter(p => p.id !== productId));
      setFavorites(favorites.filter(id => id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }, [products, favorites]);

  const canAddProduct = useCallback(() => {
    if (!currentUser) {
      return { canAdd: false, reason: 'Vous devez être connecté pour ajouter un produit.' };
    }
    if (currentUser.type === 'premium') {
      return { canAdd: true, reason: '' };
    }
    const activeProducts = userProducts.length;
    if (activeProducts >= 5) {
      return { canAdd: false, reason: 'Vous avez atteint la limite de 5 produits actifs. Passez à Premium pour un accès illimité.' };
    }
    return { canAdd: true, reason: '' };
  }, [currentUser, userProducts]);

  const getMaxImages = useCallback(() => {
    if (!currentUser) return 2;
    return currentUser.type === 'premium' ? Infinity : 2;
  }, [currentUser]);

  const upgradeToPremium = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await supabase
        .from('users')
        .update({ type: 'premium' })
        .eq('id', currentUser.id);
      
      const updatedUser = { ...currentUser, type: 'premium' as UserType };
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error upgrading to premium:', error);
    }
  }, [currentUser]);

  const requestPremiumUpgrade = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'Non connecté' };
    try {
      const { error } = await supabase
        .from('users')
        .update({
          premium_payment_pending: true,
          premium_request_date: new Date().toISOString(),
        })
        .eq('id', currentUser.id);
      
      if (error) {
        console.error('Error requesting premium upgrade:', error);
        return { success: false, error: 'Erreur lors de la demande' };
      }
      
      const updatedCurrentUser = { 
        ...currentUser, 
        premiumPaymentPending: true, 
        premiumRequestDate: new Date() 
      };
      setCurrentUser(updatedCurrentUser);
      await loadAllUsers();
      
      return { success: true };
    } catch (error) {
      console.error('Error requesting premium upgrade:', error);
      return { success: false, error: 'Erreur lors de la demande' };
    }
  }, [currentUser]);

  const approvePremiumUpgrade = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          type: 'premium',
          premium_payment_pending: false,
          premium_request_date: null,
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error approving premium upgrade:', error);
        return { success: false, error: 'Erreur lors de l\'approbation' };
      }
      
      await loadAllUsers();
      
      if (currentUser.id === userId) {
        const updatedCurrentUser = { 
          ...currentUser, 
          type: 'premium' as UserType, 
          premiumPaymentPending: false, 
          premiumRequestDate: undefined 
        };
        setCurrentUser(updatedCurrentUser);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error approving premium upgrade:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  }, [currentUser]);

  const rejectPremiumUpgrade = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          premium_payment_pending: false,
          premium_request_date: null,
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error rejecting premium upgrade:', error);
        return { success: false, error: 'Erreur lors du rejet' };
      }
      
      await loadAllUsers();
      
      if (currentUser.id === userId) {
        const updatedCurrentUser = { 
          ...currentUser, 
          premiumPaymentPending: false, 
          premiumRequestDate: undefined 
        };
        setCurrentUser(updatedCurrentUser);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting premium upgrade:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  }, [currentUser]);

  const register = useCallback(async (userData: { name: string; phone: string; password: string; location: string; deliveryAddress: string; deliveryCity: string; deliveryPhone: string }) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', userData.phone)
        .single();
      
      if (existingUser) {
        return { success: false, error: 'Ce numéro est déjà enregistré' };
      }

      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newUserData = {
        id: userId,
        name: userData.name,
        phone: userData.phone,
        password: userData.password,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=00A651&color=fff&size=200`,
        location: userData.location,
        type: 'standard',
        is_admin: false,
        delivery_address: userData.deliveryAddress,
        delivery_city: userData.deliveryCity,
        delivery_phone: userData.deliveryPhone,
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUserData]);

      if (insertError) {
        console.error('User insert error:', insertError);
        return { success: false, error: 'Erreur lors de l\'enregistrement des données' };
      }

      const newUser: User = {
        id: userId,
        name: userData.name,
        phone: userData.phone,
        password: userData.password,
        avatar: newUserData.avatar,
        location: userData.location,
        type: 'standard',
        joinedDate: new Date(),
        deliveryAddress: userData.deliveryAddress,
        deliveryCity: userData.deliveryCity,
        deliveryPhone: userData.deliveryPhone,
      };
      
      if (Platform.OS === 'web') {
        localStorage.setItem('currentUserId', userId);
      } else {
        await AsyncStorage.setItem('currentUserId', userId);
      }
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      
      toast.showSuccess('Inscription réussie ! Bienvenue sur Marketplace');
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (userError || !userData) {
        return { success: false, error: 'Aucun compte trouvé avec ce numéro' };
      }

      if (userData.password !== password) {
        return { success: false, error: 'Mot de passe incorrect' };
      }

      const user: User = {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar,
        phone: userData.phone,
        password: userData.password,
        location: userData.location,
        type: userData.type as UserType,
        isAdmin: userData.is_admin,
        isSuperAdmin: userData.is_super_admin,
        email: userData.email,
        bio: userData.bio,
        rating: userData.rating,
        reviewCount: userData.review_count,
        joinedDate: userData.joined_date ? new Date(userData.joined_date) : undefined,
        premiumPaymentPending: userData.premium_payment_pending,
        premiumRequestDate: userData.premium_request_date ? new Date(userData.premium_request_date) : undefined,
        deliveryAddress: userData.delivery_address,
        deliveryCity: userData.delivery_city,
        deliveryPhone: userData.delivery_phone,
      };

      if (Platform.OS === 'web') {
        localStorage.setItem('currentUserId', userData.id);
      } else {
        await AsyncStorage.setItem('currentUserId', userData.id);
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      toast.showSuccess(`Bienvenue ${user.name} !`);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('currentUserId');
      } else {
        await AsyncStorage.removeItem('currentUserId');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.deliveryAddress !== undefined) updateData.delivery_address = updates.deliveryAddress;
      if (updates.deliveryCity !== undefined) updateData.delivery_city = updates.deliveryCity;
      if (updates.deliveryPhone !== undefined) updateData.delivery_phone = updates.deliveryPhone;
      if (updates.isAdmin !== undefined) updateData.is_admin = updates.isAdmin;
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id);
      
      if (error) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
      }
      
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message || String(error) };
    }
  }, [currentUser]);

  const getProductReviews = useCallback((productId: string) => {
    return reviews.filter(review => review.productId === productId);
  }, [reviews]);

  const getProductRating = useCallback((productId: string) => {
    const productReviews = reviews.filter(review => review.productId === productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return { average: sum / productReviews.length, count: productReviews.length };
  }, [reviews]);

  const getSellerRating = useCallback((sellerId: string) => {
    const sellerProducts = products.filter(p => p.sellerId === sellerId);
    const sellerProductIds = sellerProducts.map(p => p.id);
    const sellerReviews = reviews.filter(r => sellerProductIds.includes(r.productId));
    if (sellerReviews.length === 0) return { average: 0, count: 0 };
    const sum = sellerReviews.reduce((acc, review) => acc + review.rating, 0);
    return { average: sum / sellerReviews.length, count: sellerReviews.length };
  }, [products, reviews]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName' | 'userAvatar'>) => {
    if (!currentUser) return;
    const newReview: Review = {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
    };
    setReviews([newReview, ...reviews]);
  }, [currentUser, reviews]);

  const getProduct = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading users:', error.message || error);
        throw new Error(error.message || 'Failed to load users');
      }
      
      if (data) {
        const users: User[] = data.map((u: any) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          phone: u.phone,
          password: u.password,
          location: u.location,
          type: u.type as UserType,
          isAdmin: u.is_admin,
          isSuperAdmin: u.is_super_admin,
          email: u.email,
          bio: u.bio,
          rating: u.rating,
          reviewCount: u.review_count,
          joinedDate: u.joined_date ? new Date(u.joined_date) : undefined,
          premiumPaymentPending: u.premium_payment_pending,
          premiumRequestDate: u.premium_request_date ? new Date(u.premium_request_date) : undefined,
          deliveryAddress: u.delivery_address,
          deliveryCity: u.delivery_city,
          deliveryPhone: u.delivery_phone,
        }));
        setAllUsers(users);
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('Error loading users:', errorMsg);
      toast.showError('Error loading users: ' + errorMsg);
    }
  };

  const changeUserType = useCallback(async (userId: string, newType: UserType) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ type: newType })
        .eq('id', userId);
      
      if (error) {
        console.error('Error changing user type:', error);
        return { success: false, error: 'Erreur lors du changement de type' };
      }
      
      await loadAllUsers();
      
      if (currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, type: newType };
        setCurrentUser(updatedCurrentUser);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error changing user type:', error);
      return { success: false, error: 'Erreur lors du changement de type' };
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) return { success: false, error: 'Non autorisé' };
    if (currentUser.id === userId) return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' };
    
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.isSuperAdmin) return { success: false, error: 'Le super administrateur ne peut pas être supprimé' };
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
      }
      
      await loadAllUsers();
      await loadProducts();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }, [currentUser, allUsers]);

  const pendingProducts = useMemo(() => {
    return products.filter(product => product.status === 'pending');
  }, [products]);

  const approveProduct = useCallback(async (productId: string) => {
    if (!currentUser?.isAdmin) return;
    
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { error } = await supabase
        .from('products')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUser.id,
        })
        .eq('id', productId);

      if (error) {
        console.error('Error approving product:', error);
        return;
      }

      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, status: 'approved' as ProductStatus, approvedAt: new Date(), approvedBy: currentUser.id } 
          : p
      ));

      await notifications.sendNotification(product.sellerId, {
        type: 'product_approved',
        title: 'Annonce approuvée',
        message: `Votre annonce "${product.title}" a été approuvée et est maintenant visible pour tous les utilisateurs.`,
        data: { productId: product.id },
      });
    } catch (error) {
      console.error('Error approving product:', error);
    }
  }, [products, currentUser, notifications]);

  const toggleAdminStatus = useCallback(async (userId: string) => {
    if (!currentUser?.isSuperAdmin) return { success: false, error: 'Seul le super administrateur peut gérer les admins' };
    
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return { success: false, error: 'Utilisateur introuvable' };
    if (targetUser.isSuperAdmin) return { success: false, error: 'Le statut du super administrateur ne peut pas être modifié' };
    if (targetUser.id === currentUser.id) return { success: false, error: 'Vous ne pouvez pas modifier votre propre statut' };
    
    try {
      const newAdminStatus = !targetUser.isAdmin;
      const { error } = await supabase
        .from('users')
        .update({ is_admin: newAdminStatus })
        .eq('id', userId);
      
      if (error) {
        console.error('Error toggling admin status:', error);
        return { success: false, error: 'Erreur lors du changement de statut' };
      }
      
      await loadAllUsers();
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return { success: false, error: 'Erreur lors du changement de statut' };
    }
  }, [currentUser, allUsers]);

  const rejectProduct = useCallback(async (productId: string, reason?: string) => {
    if (!currentUser?.isAdmin) return;
    
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const { error } = await supabase
        .from('products')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', productId);

      if (error) {
        console.error('Error rejecting product:', error);
        return;
      }

      setProducts(products.map(p => 
        p.id === productId 
          ? { ...p, status: 'rejected' as ProductStatus, rejectedAt: new Date(), rejectionReason: reason } 
          : p
      ));

      await notifications.sendNotification(product.sellerId, {
        type: 'product_rejected',
        title: 'Annonce rejetée',
        message: `Votre annonce "${product.title}" a été rejetée. Raison: ${reason || 'Non spécifié'}`,
        data: { productId: product.id, reason: reason },
      });
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  }, [products, currentUser, notifications]);

  return useMemo(() => ({
    products,
    filteredProducts,
    favoriteProducts,
    userProducts,
    pendingProducts,
    favorites,
    toggleFavorite,
    isFavorite,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    canAddProduct,
    getMaxImages,
    upgradeToPremium,
    requestPremiumUpgrade,
    approvePremiumUpgrade,
    rejectPremiumUpgrade,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    currentUser,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    reviews,
    getProductReviews,
    getProductRating,
    getSellerRating,
    addReview,
    approveProduct,
    rejectProduct,
    allUsers,
    changeUserType,
    deleteUser,
    toggleAdminStatus,
  }), [
    products,
    filteredProducts,
    favoriteProducts,
    userProducts,
    pendingProducts,
    favorites,
    toggleFavorite,
    isFavorite,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    canAddProduct,
    getMaxImages,
    upgradeToPremium,
    requestPremiumUpgrade,
    approvePremiumUpgrade,
    rejectPremiumUpgrade,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    currentUser,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    reviews,
    getProductReviews,
    getProductRating,
    getSellerRating,
    addReview,
    approveProduct,
    rejectProduct,
    allUsers,
    changeUserType,
    deleteUser,
    toggleAdminStatus,
  ]);
});
