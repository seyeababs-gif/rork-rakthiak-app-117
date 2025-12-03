-- ============================================
-- FONCTIONS RPC OPTIMISÉES POUR LA PERFORMANCE
-- ============================================

-- Fonction RPC pour récupérer les produits avec pagination et filtres
CREATE OR REPLACE FUNCTION get_products_paginated(
  p_page INT DEFAULT 0,
  p_page_size INT DEFAULT 20,
  p_category TEXT DEFAULT 'all',
  p_sub_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT '',
  p_status TEXT DEFAULT 'approved'
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC,
  images TEXT[],
  category TEXT,
  sub_category TEXT,
  location TEXT,
  seller_id TEXT,
  seller_name TEXT,
  seller_avatar TEXT,
  seller_phone TEXT,
  created_at TIMESTAMPTZ,
  condition TEXT,
  status TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  approved_by TEXT,
  average_rating NUMERIC,
  review_count INT,
  listing_type TEXT,
  service_details JSONB,
  stock_quantity INT,
  is_out_of_stock BOOLEAN,
  has_discount BOOLEAN,
  discount_percent NUMERIC,
  original_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.images,
    p.category,
    p.sub_category,
    p.location,
    p.seller_id,
    p.seller_name,
    p.seller_avatar,
    p.seller_phone,
    p.created_at,
    p.condition,
    p.status,
    p.rejection_reason,
    p.approved_at,
    p.rejected_at,
    p.approved_by,
    p.average_rating,
    p.review_count,
    p.listing_type,
    p.service_details,
    p.stock_quantity,
    p.is_out_of_stock,
    p.has_discount,
    p.discount_percent,
    p.original_price
  FROM products p
  WHERE 
    (p_status = 'all' OR p.status = p_status)
    AND (p_category = 'all' OR p.category = p_category)
    AND (p_sub_category IS NULL OR p.sub_category = p_sub_category)
    AND (
      p_search = '' 
      OR p.title ILIKE '%' || p_search || '%' 
      OR p.description ILIKE '%' || p_search || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT p_page_size
  OFFSET (p_page * p_page_size);
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir les statistiques d'un vendeur
CREATE OR REPLACE FUNCTION get_seller_stats(seller_id_param TEXT)
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  average_rating NUMERIC,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_products,
    COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_products,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
  FROM products p
  LEFT JOIN reviews r ON p.id = r.product_id
  WHERE p.seller_id = seller_id_param
  GROUP BY p.seller_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour récupérer les commandes avec filtres optimisés
CREATE OR REPLACE FUNCTION get_orders_filtered(
  p_user_id TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'all',
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id TEXT,
  user_id TEXT,
  user_name TEXT,
  user_phone TEXT,
  items JSONB,
  total_amount NUMERIC,
  status TEXT,
  payment_method TEXT,
  wave_transaction_id TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  has_review BOOLEAN,
  delivery_name TEXT,
  delivery_phone TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.user_name,
    o.user_phone,
    o.items,
    o.total_amount,
    o.status,
    o.payment_method,
    o.wave_transaction_id,
    o.created_at,
    o.paid_at,
    o.validated_at,
    o.rejected_at,
    o.rejection_reason,
    o.shipped_at,
    o.completed_at,
    o.has_review,
    o.delivery_name,
    o.delivery_phone,
    o.delivery_address,
    o.delivery_city,
    o.updated_at
  FROM orders o
  WHERE 
    (p_is_admin = TRUE OR o.user_id = p_user_id)
    AND (p_status = 'all' OR o.status = p_status)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour compter les notifications non lues rapidement
CREATE OR REPLACE FUNCTION count_unread_notifications(user_id_param TEXT)
RETURNS INT AS $$
DECLARE
  unread_count INT;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = user_id_param AND is_read = FALSE;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir les produits populaires (avec cache)
CREATE OR REPLACE FUNCTION get_popular_products(limit_param INT DEFAULT 10)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  price NUMERIC,
  images TEXT[],
  category TEXT,
  location TEXT,
  seller_name TEXT,
  has_discount BOOLEAN,
  discount_percent NUMERIC,
  original_price NUMERIC,
  favorite_count BIGINT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.images,
    p.category,
    p.location,
    p.seller_name,
    p.has_discount,
    p.discount_percent,
    p.original_price,
    COUNT(DISTINCT f.user_id) as favorite_count,
    0::BIGINT as view_count
  FROM products p
  LEFT JOIN favorites f ON p.id = f.product_id
  WHERE p.status = 'approved'
  GROUP BY p.id
  ORDER BY favorite_count DESC, p.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- Index pour optimiser les fonctions RPC
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Activer la mise en cache pour les requêtes stables
ALTER FUNCTION get_products_paginated SET search_path = public;
ALTER FUNCTION get_seller_stats SET search_path = public;
ALTER FUNCTION get_orders_filtered SET search_path = public;
ALTER FUNCTION count_unread_notifications SET search_path = public;
ALTER FUNCTION get_popular_products SET search_path = public;

COMMENT ON FUNCTION get_products_paginated IS 'Fonction RPC optimisée pour récupérer les produits avec pagination et filtres';
COMMENT ON FUNCTION get_seller_stats IS 'Fonction RPC pour obtenir les statistiques d''un vendeur';
COMMENT ON FUNCTION get_orders_filtered IS 'Fonction RPC pour récupérer les commandes filtrées';
COMMENT ON FUNCTION count_unread_notifications IS 'Fonction RPC pour compter rapidement les notifications non lues';
COMMENT ON FUNCTION get_popular_products IS 'Fonction RPC pour obtenir les produits populaires';
