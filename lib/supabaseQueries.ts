import { supabase } from '@/lib/supabase';
import { Product, Category, SubCategory, ProductStatus } from '@/types/marketplace';
import { cache } from '@/lib/cache';

interface FetchProductsParams {
  page?: number;
  pageSize?: number;
  category?: Category;
  subCategory?: SubCategory;
  search?: string;
  status?: ProductStatus | 'all';
  skipCache?: boolean;
}

const DEFAULT_PAGE_SIZE = 5;

export async function fetchProducts(params: FetchProductsParams = {}): Promise<Product[]> {
  const {
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    category = 'all',
    subCategory,
    search = '',
    status = 'approved',
    skipCache = false,
  } = params;

  const cacheKey = `products_${page}_${category}_${subCategory || 'all'}_${search}_${status}`;
  
  if (!skipCache) {
    const cached = await cache.get<Product[]>(cacheKey);
    if (cached) {
      setTimeout(() => {
        fetchProducts({ ...params, skipCache: true }).catch(err => console.log('Background refresh error:', err));
      }, 0);
      return cached;
    }
  }

  try {
    let query = supabase
      .from('products')
      .select('*');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (subCategory) {
      query = query.eq('sub_category', subCategory);
    }

    if (search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    if (!data) return [];

    const products: Product[] = data.map((p: any) => ({
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
      listingType: p.listing_type,
      serviceDetails: p.service_details,
      stockQuantity: p.stock_quantity,
      isOutOfStock: p.is_out_of_stock,
      hasDiscount: p.has_discount,
      discountPercent: p.discount_percent,
      originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
    }));

    await cache.set(cacheKey, products);

    return products;
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const cacheKey = `product_${id}`;
  
  const cached = await cache.get<Product>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching product:', error);
      return null;
    }

    const product: Product = {
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
      rejectionReason: data.rejection_reason,
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
      approvedBy: data.approved_by,
      averageRating: data.average_rating,
      reviewCount: data.review_count,
      listingType: data.listing_type,
      serviceDetails: data.service_details,
      stockQuantity: data.stock_quantity,
      isOutOfStock: data.is_out_of_stock,
      hasDiscount: data.has_discount,
      discountPercent: data.discount_percent,
      originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
    };

    await cache.set(cacheKey, product);

    return product;
  } catch (error) {
    console.error('Error in fetchProductById:', error);
    return null;
  }
}

export async function prefetchNextPage(params: FetchProductsParams): Promise<void> {
  const nextPage = (params.page || 0) + 1;
  await fetchProducts({ ...params, page: nextPage });
}

export async function invalidateProductCache(): Promise<void> {
  await cache.invalidate('products');
}
