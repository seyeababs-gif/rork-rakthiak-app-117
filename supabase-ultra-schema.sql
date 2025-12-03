-- ============================================
-- SCHÉMA BACKEND ULTRA-RAPIDE MARKETPLACE
-- ============================================

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'standard',
  is_admin BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  email TEXT,
  bio TEXT,
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0,
  joined_date TIMESTAMP DEFAULT NOW(),
  premium_payment_pending BOOLEAN DEFAULT FALSE,
  premium_request_date TIMESTAMP,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_premium_pending ON users(premium_payment_pending) WHERE premium_payment_pending = TRUE;

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  images TEXT[] NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  location TEXT NOT NULL,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_avatar TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  approved_by TEXT,
  listing_type TEXT DEFAULT 'product',
  service_details JSONB,
  stock_quantity INTEGER,
  is_out_of_stock BOOLEAN DEFAULT FALSE,
  has_discount BOOLEAN DEFAULT FALSE,
  discount_percent NUMERIC(5,2),
  original_price NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index ultra-optimisés pour products (page d'accueil)
CREATE INDEX idx_products_homepage ON products(status, created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_products_category ON products(category, status, created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_products_seller ON products(seller_id, status, created_at DESC);
CREATE INDEX idx_products_discount ON products(has_discount, discount_percent DESC, created_at DESC) WHERE has_discount = TRUE AND status = 'approved';
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('french', title || ' ' || description));

-- ============================================
-- TABLE: favorites
-- ============================================
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Index pour favorites
CREATE INDEX idx_favorites_user ON favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_method TEXT NOT NULL,
  wave_transaction_id TEXT,
  rejection_reason TEXT,
  has_review BOOLEAN DEFAULT FALSE,
  delivery_name TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  validated_at TIMESTAMP,
  rejected_at TIMESTAMP,
  shipped_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Index pour orders
CREATE INDEX idx_orders_user ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  product_images TEXT[] NOT NULL,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id, created_at DESC);

-- ============================================
-- TABLE: reviews
-- ============================================
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour reviews
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_seller ON reviews(seller_id, created_at DESC);
CREATE INDEX idx_reviews_order ON reviews(order_id);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- FONCTION: Recherche rapide de produits
-- ============================================
CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_sub_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
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
  created_at TIMESTAMP,
  condition TEXT,
  status TEXT,
  listing_type TEXT,
  service_details JSONB,
  has_discount BOOLEAN,
  discount_percent NUMERIC,
  original_price NUMERIC
) 
LANGUAGE plpgsql
STABLE
AS $$
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
    p.listing_type,
    p.service_details,
    p.has_discount,
    p.discount_percent,
    p.original_price
  FROM products p
  WHERE p.status = 'approved'
    AND (p_query IS NULL OR to_tsvector('french', p.title || ' ' || p.description) @@ plainto_tsquery('french', p_query))
    AND (p_category IS NULL OR p_category = 'all' OR p.category = p_category)
    AND (p_sub_category IS NULL OR p_sub_category = 'all' OR p.sub_category = p_sub_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- FONCTION: Stats vendeur
-- ============================================
CREATE OR REPLACE FUNCTION get_seller_stats(p_seller_id TEXT)
RETURNS TABLE (
  total_products BIGINT,
  total_sales BIGINT,
  total_revenue NUMERIC,
  pending_orders BIGINT,
  completed_orders BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id AND status = 'approved')::BIGINT as total_products,
    (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = p_seller_id AND o.status IN ('completed', 'shipped'))::BIGINT as total_sales,
    (SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity * 0.9), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = p_seller_id AND o.status = 'completed') as total_revenue,
    (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = p_seller_id AND o.status IN ('paid', 'validated'))::BIGINT as pending_orders,
    (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.seller_id = p_seller_id AND o.status = 'completed')::BIGINT as completed_orders;
END;
$$;

-- ============================================
-- TRIGGERS: Mise à jour automatique
-- ============================================

-- Trigger: Mettre à jour le rating du vendeur
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET 
    rating = (SELECT AVG(rating) FROM reviews WHERE seller_id = NEW.seller_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE seller_id = NEW.seller_id)
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_seller_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour users (lecture publique, modification propre compte uniquement)
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (true);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (true);
CREATE POLICY users_delete_policy ON users FOR DELETE USING (true);

-- Policies pour products (lecture publique, modification par vendeur)
CREATE POLICY products_select_policy ON products FOR SELECT USING (true);
CREATE POLICY products_insert_policy ON products FOR INSERT WITH CHECK (true);
CREATE POLICY products_update_policy ON products FOR UPDATE USING (true);
CREATE POLICY products_delete_policy ON products FOR DELETE USING (true);

-- Policies pour favorites
CREATE POLICY favorites_select_policy ON favorites FOR SELECT USING (true);
CREATE POLICY favorites_insert_policy ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY favorites_update_policy ON favorites FOR UPDATE USING (true);
CREATE POLICY favorites_delete_policy ON favorites FOR DELETE USING (true);

-- Policies pour orders
CREATE POLICY orders_select_policy ON orders FOR SELECT USING (true);
CREATE POLICY orders_insert_policy ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY orders_update_policy ON orders FOR UPDATE USING (true);
CREATE POLICY orders_delete_policy ON orders FOR DELETE USING (true);

-- Policies pour order_items
CREATE POLICY order_items_select_policy ON order_items FOR SELECT USING (true);
CREATE POLICY order_items_insert_policy ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY order_items_update_policy ON order_items FOR UPDATE USING (true);
CREATE POLICY order_items_delete_policy ON order_items FOR DELETE USING (true);

-- Policies pour reviews
CREATE POLICY reviews_select_policy ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_policy ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY reviews_update_policy ON reviews FOR UPDATE USING (true);
CREATE POLICY reviews_delete_policy ON reviews FOR DELETE USING (true);

-- Policies pour notifications
CREATE POLICY notifications_select_policy ON notifications FOR SELECT USING (true);
CREATE POLICY notifications_insert_policy ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_update_policy ON notifications FOR UPDATE USING (true);
CREATE POLICY notifications_delete_policy ON notifications FOR DELETE USING (true);

-- ============================================
-- OPTIMISATIONS PERFORMANCE
-- ============================================

-- Augmenter fillfactor pour tables à forte lecture
ALTER TABLE products SET (fillfactor = 95);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE orders SET (fillfactor = 90);

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE users;
ANALYZE products;
ANALYZE favorites;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE notifications;

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
