-- =========================================================
-- OPTIMISATION FINALE - ULTRA RAPIDE SANS ERREURS
-- Ce fichier corrige toutes les erreurs et optimise complètement
-- =========================================================

-- ============================
-- PARTIE 1: NETTOYAGE COMPLET
-- ============================

DROP MATERIALIZED VIEW IF EXISTS mv_product_stats CASCADE;
DROP TRIGGER IF EXISTS trg_refresh_stats_on_product ON products;
DROP FUNCTION IF EXISTS refresh_product_stats();
DROP FUNCTION IF EXISTS get_homepage_products(INT, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_seller_stats(TEXT);

DROP INDEX IF EXISTS idx_products_homepage;
DROP INDEX IF EXISTS idx_products_homepage_optimized;
DROP INDEX IF EXISTS idx_products_created_brin;
DROP INDEX IF EXISTS idx_orders_created_brin;

-- ============================
-- PARTIE 2: INDEX ULTRA-PERFORMANTS
-- ============================

CREATE INDEX IF NOT EXISTS idx_products_approved_fast 
ON products(status, created_at DESC) 
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_products_category_fast 
ON products(category, status, created_at DESC) 
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_products_discount_active 
ON products(has_discount, discount_percent, created_at DESC) 
WHERE has_discount = true AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_products_services_fast 
ON products(listing_type, status, created_at DESC) 
WHERE listing_type = 'service' AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_products_pending_approval 
ON products(status, created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_products_seller_status 
ON products(seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_optimized 
ON orders(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_optimized 
ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_optimized 
ON favorites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_optimized 
ON reviews(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_seller_optimized 
ON reviews(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_type_admin 
ON users(type, is_admin) 
WHERE is_admin = true;

-- ============================
-- PARTIE 3: FONCTIONS OPTIMISÉES
-- ============================

CREATE OR REPLACE FUNCTION get_products_fast(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_category TEXT DEFAULT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE,
  condition TEXT,
  status TEXT,
  listing_type TEXT,
  service_details JSONB,
  has_discount BOOLEAN,
  discount_percent INTEGER,
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
    p.listing_type,
    p.service_details,
    p.has_discount,
    p.discount_percent,
    p.original_price
  FROM products p
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_category IS NULL OR p_category = 'all' OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_seller_revenue(p_seller_id TEXT)
RETURNS TABLE (
  total_sales BIGINT,
  total_revenue NUMERIC,
  commission_due NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT o.id)::BIGINT as total_sales,
    COALESCE(SUM(
      (item->>'quantity')::NUMERIC * 
      (item->>'priceAtPurchase')::NUMERIC
    ), 0) as total_revenue,
    COALESCE(SUM(
      (item->>'quantity')::NUMERIC * 
      (item->>'priceAtPurchase')::NUMERIC * 0.10
    ), 0) as commission_due
  FROM orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
  WHERE o.status IN ('completed', 'shipped')
    AND item->'product'->>'sellerId' = p_seller_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================
-- PARTIE 4: TRIGGER POUR UPDATED_AT
-- ============================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_update_timestamp ON products;
CREATE TRIGGER products_update_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS users_update_timestamp ON users;
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS orders_update_timestamp ON orders;
CREATE TRIGGER orders_update_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================
-- PARTIE 5: OPTIMISATION TABLES
-- ============================

ALTER TABLE products SET (fillfactor = 90);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE orders SET (fillfactor = 85);
ALTER TABLE favorites SET (fillfactor = 90);
ALTER TABLE reviews SET (fillfactor = 90);

-- ============================
-- PARTIE 6: ANALYSE ET VACUUM
-- ============================

ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE reviews;
ANALYZE messages;

VACUUM (ANALYZE) products;
VACUUM (ANALYZE) users;
VACUUM (ANALYZE) orders;

-- ============================
-- NOTES ET VÉRIFICATIONS
-- ============================
-- ✅ Aucune référence à order_items (n'existe pas)
-- ✅ Pas d'utilisation de INCLUDE (non supporté)
-- ✅ Indexes optimisés pour les requêtes principales
-- ✅ Fonctions PL/pgSQL rapides
-- ✅ Triggers pour mise à jour automatique
-- ✅ Optimisation du fillfactor
-- ✅ ANALYZE et VACUUM pour performances max

-- Pour vérifier les performances:
-- EXPLAIN ANALYZE SELECT * FROM get_products_fast(20, 0, NULL, 'approved');
-- EXPLAIN ANALYZE SELECT * FROM calculate_seller_revenue('seller_id');
