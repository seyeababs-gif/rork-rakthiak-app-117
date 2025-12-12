import createContextHook from '@nkzw/create-context-hook';
import React, { useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category, User, UserType, Review, ProductStatus, SubCategory, ListingType } from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/contexts/ToastContext';
import { useScrollingMessage } from '@/contexts/ScrollingMessageContext';

const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    let storedUserId: string | null = null;
    if (Platform.OS === 'web') {
      storedUserId = localStorage.getItem('currentUserId');
    } else {
      storedUserId = await AsyncStorage.getItem('currentUserId');
    }
    if (!storedUserId) return null;
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', storedUserId)
      .single();
    
    if (error || !userData) {
      if (Platform.OS === 'web') {
        localStorage.removeItem('currentUserId');
      } else {
        await AsyncStorage.removeItem('currentUserId');
      }
      return null;
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
    return user;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
};

const fetchProducts = async (page: number = 0, limit: number = 100): Promise<Product[]> => {
  try {
    console.log(`[FETCH PRODUCTS] Fetching page ${page} with limit ${limit}...`);
    const start = page * limit;
    const end = start + limit - 1;
    
    const { data, error } = await supabase
      .from('products')
      .select('id,title,price,images,category,sub_category,location,seller_id,seller_name,seller_avatar,condition,status,listing_type,has_discount,discount_percent,original_price,created_at,description,service_details,stock_quantity,is_out_of_stock,rejection_reason')
      .order('created_at', { ascending: false })
      .range(start, end);
    
    if (error) {
      console.error('Error loading products:', error.message || error);
      throw new Error(error.message || 'Failed to load products');
    }

    if (!data) return [];
    
    const mappedProducts: Product[] = data.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: parseFloat(p.price),
      images: p.images || [],
      category: p.category as Category,
      subCategory: p.sub_category as SubCategory | undefined,
      location: p.location,
      sellerId: p.seller_id,
      sellerName: p.seller_name,
      sellerAvatar: p.seller_avatar,
      sellerPhone: '',
      createdAt: new Date(p.created_at),
      condition: p.condition,
      status: p.status as ProductStatus,
      listingType: p.listing_type as ListingType,
      hasDiscount: p.has_discount,
      discountPercent: p.discount_percent,
      originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
      serviceDetails: p.service_details,
      stockQuantity: p.stock_quantity,
      isOutOfStock: p.is_out_of_stock,
      rejectionReason: p.rejection_reason,
    }));
    return mappedProducts;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error loading products from server:', errorMsg);
    return [];
  }
};

const fetchFavorites = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
    
    if (!data) return [];
    return data.map((f: any) => f.product_id);
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false});
    
    if (error) {
      console.error('Error loading users:', error.message || error);
      throw new Error(error.message || 'Failed to load users');
    }
    
    if (!data) return [];
    
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
    return users;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error loading users:', errorMsg);
    return [];
  }
};

export const [MarketplaceProvider, useMarketplace] = createContextHook(() => {
  const notifications = useNotifications();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isGlobalPremiumEnabled } = useScrollingMessage();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [allLoadedProducts, setAllLoadedProducts] = useState<Product[]>([]);

  const { data: currentUser = null } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: products = [], isFetching } = useQuery({
    queryKey: ['products', currentPage],
    queryFn: () => fetchProducts(currentPage, 100),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (products.length > 0) {
      setAllLoadedProducts(prev => {
        const existing = new Set(prev.map(p => p.id));
        const newProducts = products.filter(p => !existing.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  }, [products]);

  const loadMoreProducts = useCallback(() => {
    if (!isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  }, [isFetching]);

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', currentUser?.id, currentUser],
    queryFn: () => currentUser ? fetchFavorites(currentUser.id) : Promise.resolve([]),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: fetchAllUsers,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const isAuthenticated = !!currentUser;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ productId, isFav, userId }: { productId: string; isFav: boolean; userId: string }) => {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: userId, product_id: productId }]);
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] });
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
    },
  });

  const toggleFavorite = useCallback((productId: string) => {
    if (!isAuthenticated || !currentUser) return;
    const isFav = favorites.includes(productId);
    toggleFavoriteMutation.mutate({ productId, isFav, userId: currentUser.id });
  }, [favorites, isAuthenticated, currentUser, toggleFavoriteMutation]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const filteredProducts = useMemo(() => {
    console.log('[MARKETPLACE] 📦 Total products loaded:', allLoadedProducts.length);
    const approvedCount = allLoadedProducts.filter(p => p.status === 'approved').length;
    console.log('[MARKETPLACE] ✅ Approved products:', approvedCount);
    console.log('[MARKETPLACE] 👤 User role - Admin:', currentUser?.isAdmin, 'SuperAdmin:', currentUser?.isSuperAdmin);
    
    const filtered = allLoadedProducts.filter(product => {
      const isApproved = product.status === 'approved';
      const isAdmin = currentUser?.isAdmin === true;
      const isSuperAdmin = currentUser?.isSuperAdmin === true;
      const canView = isAdmin || isSuperAdmin || isApproved;
      
      if (!canView) {
        return false;
      }
      
      const matchesSearch = searchQuery.trim() === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || product.subCategory === selectedSubCategory;
      
      return matchesSearch && matchesCategory && matchesSubCategory;
    });
    
    console.log('[MARKETPLACE] 🔍 Filtered products to display:', filtered.length);
    return filtered;
  }, [allLoadedProducts, searchQuery, selectedCategory, selectedSubCategory, currentUser]);

  const favoriteProducts = useMemo(() => {
    return allLoadedProducts.filter(product => favorites.includes(product.id));
  }, [allLoadedProducts, favorites]);

  const userProducts = useMemo(() => {
    if (!currentUser) return [];
    return allLoadedProducts.filter(product => product.sellerId === currentUser.id);
  }, [allLoadedProducts, currentUser]);

  const addProductMutation = useMutation({
    mutationFn: async ({ product, user }: { product: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'status'>, user: User }) => {
      const newProductData = {
        id: `product-${Date.now()}`,
        title: product.title,
        description: product.description,
        price: product.price,
        images: product.images,
        category: product.category,
        sub_category: product.subCategory,
        location: product.location,
        seller_id: user.id,
        seller_name: user.name,
        seller_avatar: user.avatar,
        seller_phone: user.phone,
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

      if (error) throw new Error(error.message);
      if (!data) throw new Error('No data returned');

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

      await notifications.sendNotificationToAdmins({
        type: 'product_published',
        title: 'Nouvelle annonce publiée',
        message: `${user.name} a publié une nouvelle annonce: ${product.title}`,
        data: { productId: data.id, sellerId: user.id },
      });

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'status'>) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    
    try {
      const result = await addProductMutation.mutateAsync({ product, user: currentUser });
      return { success: true, product: result };
    } catch (error: any) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message || String(error) };
    }
  }, [currentUser, addProductMutation]);

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, updates, user }: { productId: string; updates: Partial<Product>; user: User }) => {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subCategory !== undefined) updateData.sub_category = updates.subCategory;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.condition !== undefined) updateData.condition = updates.condition;
      
      const isPremium = user?.type === 'premium' || isGlobalPremiumEnabled;
      if (isPremium) {
        if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity;
        if (updates.isOutOfStock !== undefined) updateData.is_out_of_stock = updates.isOutOfStock;
        if (updates.hasDiscount !== undefined) updateData.has_discount = updates.hasDiscount;
        if (updates.discountPercent !== undefined) updateData.discount_percent = updates.discountPercent;
        if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice;
      }
      
      if (updates.serviceDetails !== undefined) updateData.service_details = updates.serviceDetails;
      if (updates.listingType !== undefined) updateData.listing_type = updates.listingType;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!currentUser) return;
    
    try {
      await updateProductMutation.mutateAsync({ productId, updates, user: currentUser });
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }, [currentUser, updateProductMutation]);

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }, [deleteProductMutation]);

  const canAddProduct = useCallback(() => {
    if (!currentUser) {
      return { canAdd: false, reason: 'Vous devez être connecté pour ajouter un produit.' };
    }
    if (currentUser.type === 'premium' || isGlobalPremiumEnabled) {
      return { canAdd: true, reason: '' };
    }
    const activeProducts = userProducts.length;
    if (activeProducts >= 5) {
      return { canAdd: false, reason: 'Vous avez atteint la limite de 5 produits actifs. Passez à Premium pour un accès illimité.' };
    }
    return { canAdd: true, reason: '' };
  }, [currentUser, userProducts, isGlobalPremiumEnabled]);

  const getMaxImages = useCallback(() => {
    if (!currentUser) return 2;
    return (currentUser.type === 'premium' || isGlobalPremiumEnabled) ? Infinity : 2;
  }, [currentUser, isGlobalPremiumEnabled]);

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const requestPremiumUpgrade = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'Non connecté' };
    try {
      await updateUserMutation.mutateAsync({
        userId: currentUser.id,
        updates: {
          premium_payment_pending: true,
          premium_request_date: new Date().toISOString(),
        },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error requesting premium upgrade:', error);
      return { success: false, error: 'Erreur lors de la demande' };
    }
  }, [currentUser, updateUserMutation]);

  const approvePremiumUpgrade = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      await updateUserMutation.mutateAsync({
        userId,
        updates: {
          type: 'premium',
          premium_payment_pending: false,
          premium_request_date: null,
        },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error approving premium upgrade:', error);
      return { success: false, error: 'Erreur lors de l\'approbation' };
    }
  }, [currentUser, updateUserMutation]);

  const rejectPremiumUpgrade = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      await updateUserMutation.mutateAsync({
        userId,
        updates: {
          premium_payment_pending: false,
          premium_request_date: null,
        },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting premium upgrade:', error);
      return { success: false, error: 'Erreur lors du rejet' };
    }
  }, [currentUser, updateUserMutation]);

  const registerMutation = useMutation({
    mutationFn: async (userData: { name: string; phone: string; password: string; location: string; deliveryAddress: string; deliveryCity: string; deliveryPhone: string }) => {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', userData.phone)
        .single();
      
      if (existingUser) {
        throw new Error('Ce numéro est déjà enregistré');
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
        throw new Error('Erreur lors de l\'enregistrement des données');
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
      
      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.showSuccess('Inscription réussie ! Bienvenue sur Marketplace');
    },
  });

  const register = useCallback(async (userData: { name: string; phone: string; password: string; location: string; deliveryAddress: string; deliveryCity: string; deliveryPhone: string }) => {
    try {
      const user = await registerMutation.mutateAsync(userData);
      return { success: true, user };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'inscription' };
    }
  }, [registerMutation]);

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (userError || !userData) {
        throw new Error('Aucun compte trouvé avec ce numéro');
      }

      if (userData.password !== password) {
        throw new Error('Mot de passe incorrect');
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
      
      return user;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.showSuccess(`Bienvenue ${user.name} !`);
    },
  });

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const user = await loginMutation.mutateAsync({ phone, password });
      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Erreur lors de la connexion' };
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('currentUserId');
      } else {
        await AsyncStorage.removeItem('currentUserId');
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [queryClient]);

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
      
      await updateUserMutation.mutateAsync({ userId: currentUser.id, updates: updateData });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message || String(error) };
    }
  }, [currentUser, updateUserMutation]);

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
    const sellerProducts = allLoadedProducts.filter(p => p.sellerId === sellerId);
    const sellerProductIds = sellerProducts.map(p => p.id);
    const sellerReviews = reviews.filter(r => sellerProductIds.includes(r.productId));
    if (sellerReviews.length === 0) return { average: 0, count: 0 };
    const sum = sellerReviews.reduce((acc, review) => acc + review.rating, 0);
    return { average: sum / sellerReviews.length, count: sellerReviews.length };
  }, [allLoadedProducts, reviews]);

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
    return allLoadedProducts.find(p => p.id === productId);
  }, [allLoadedProducts]);

  const changeUserType = useCallback(async (userId: string, newType: UserType) => {
    if (!currentUser?.isAdmin) return { success: false, error: 'Non autorisé' };
    
    try {
      await updateUserMutation.mutateAsync({
        userId,
        updates: { type: newType },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error changing user type:', error);
      return { success: false, error: 'Erreur lors du changement de type' };
    }
  }, [currentUser, updateUserMutation]);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteUser = useCallback(async (userId: string) => {
    if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) return { success: false, error: 'Non autorisé' };
    if (currentUser.id === userId) return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' };
    
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.isSuperAdmin) return { success: false, error: 'Le super administrateur ne peut pas être supprimé' };
    
    try {
      await deleteUserMutation.mutateAsync(userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }, [currentUser, allUsers, deleteUserMutation]);

  const pendingProducts = useMemo(() => {
    return allLoadedProducts.filter(product => product.status === 'pending');
  }, [allLoadedProducts]);

  const approveProductMutation = useMutation({
    mutationFn: async ({ productId, userId, product }: { productId: string; userId: string; product: Product }) => {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .eq('id', productId);

      if (error) throw error;

      await notifications.sendNotification(product.sellerId, {
        type: 'product_approved',
        title: 'Annonce approuvée',
        message: `Votre annonce "${product.title}" a été approuvée et est maintenant visible pour tous les utilisateurs.`,
        data: { productId: product.id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const approveProduct = useCallback(async (productId: string) => {
    if (!currentUser?.isAdmin) return;
    
    try {
      const product = allLoadedProducts.find(p => p.id === productId);
      if (!product) return;

      await approveProductMutation.mutateAsync({ productId, userId: currentUser.id, product });
    } catch (error) {
      console.error('Error approving product:', error);
    }
  }, [allLoadedProducts, currentUser, approveProductMutation]);

  const toggleAdminStatus = useCallback(async (userId: string) => {
    if (!currentUser?.isSuperAdmin) return { success: false, error: 'Seul le super administrateur peut gérer les admins' };
    
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return { success: false, error: 'Utilisateur introuvable' };
    if (targetUser.isSuperAdmin) return { success: false, error: 'Le statut du super administrateur ne peut pas être modifié' };
    if (targetUser.id === currentUser.id) return { success: false, error: 'Vous ne pouvez pas modifier votre propre statut' };
    
    try {
      const newAdminStatus = !targetUser.isAdmin;
      await updateUserMutation.mutateAsync({
        userId,
        updates: { is_admin: newAdminStatus },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return { success: false, error: 'Erreur lors du changement de statut' };
    }
  }, [currentUser, allUsers, updateUserMutation]);

  const rejectProductMutation = useMutation({
    mutationFn: async ({ productId, reason, product }: { productId: string; reason?: string; product: Product }) => {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', productId);

      if (error) throw error;

      await notifications.sendNotification(product.sellerId, {
        type: 'product_rejected',
        title: 'Annonce rejetée',
        message: `Votre annonce "${product.title}" a été rejetée. Raison: ${reason || 'Non spécifié'}`,
        data: { productId: product.id, reason: reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const rejectProduct = useCallback(async (productId: string, reason?: string) => {
    if (!currentUser?.isAdmin) return;
    
    try {
      const product = allLoadedProducts.find(p => p.id === productId);
      if (!product) return;

      await rejectProductMutation.mutateAsync({ productId, reason, product });
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  }, [allLoadedProducts, currentUser, rejectProductMutation]);

  return useMemo(() => ({
    products: allLoadedProducts,
    loadMoreProducts,
    isFetchingMore: isFetching,
    hasMoreProducts: products.length >= 100,
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
    upgradeToPremium: () => {},
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
    allLoadedProducts,
    loadMoreProducts,
    isFetching,
    products.length,
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
