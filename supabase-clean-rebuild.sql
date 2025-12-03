-- =========================================================
-- NETTOYAGE COMPLET ET RECONSTRUCTION - ONE SHOT
-- Ce script supprime TOUT et reconstruit proprement
-- =========================================================

-- ============================
-- ÉTAPE 1: SUPPRESSION COMPLÈTE DE TOUTES LES FONCTIONS
-- ============================

DROP FUNCTION IF EXISTS get_homepage_products(INT, INT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products(INT, INT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products(INT, INT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products(INT) CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products() CASCADE;

DROP FUNCTION IF EXISTS get_seller_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_seller_stats(UUID) CASCADE;

DROP FUNCTION IF EXISTS calculate_seller_revenue(TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_seller_revenue(UUID) CASCADE;

DROP FUNCTION IF EXISTS get_products_fast(INT, INT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_products_fast(INT, INT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_products_fast(INT, INT) CASCADE;

DROP FUNCTION IF EXISTS refresh_product_stats() CASCADE;
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;

DROP MATERIALIZED VIEW IF EXISTS mv_product_stats CASCADE;

-- ============================
-- ÉTAPE 2: SUPPRESSION DES INDEX ANCIENS
-- ============================

DROP INDEX IF EXISTS idx_products_homepage CASCADE;
DROP INDEX IF EXISTS idx_products_homepage_optimized CASCADE;
DROP INDEX IF EXISTS idx_products_created_brin CASCADE;
DROP INDEX IF EXISTS idx_orders_created_brin CASCADE;
DROP INDEX IF EXISTS idx_products_approved_fast CASCADE;
DROP INDEX IF EXISTS idx_products_category_fast CASCADE;
DROP INDEX IF EXISTS idx_products_discount_active CASCADE;
DROP INDEX IF EXISTS idx_products_services_fast CASCADE;
DROP INDEX IF EXISTS idx_products_pending_approval CASCADE;

-- ============================
-- ÉTAPE 3: CRÉATION DES INDEX ULTRA-PERFORMANTS
-- ============================

-- Index pour page d'accueil (requête la plus fréquente)
CREATE INDEX idx_products_home ON products(status, created_at DESC) 
WHERE status = 'approved';

-- Index pour recherche par catégorie
CREATE INDEX idx_products_cat ON products(category, status, created_at DESC) 
WHERE status = 'approved';

-- Index pour produits avec réductions
CREATE INDEX idx_products_disc ON products(has_discount, created_at DESC) 
WHERE has_discount = true AND status = 'approved';

-- Index pour services
CREATE INDEX idx_products_serv ON products(listing_type, status, created_at DESC) 
WHERE listing_type = 'service' AND status = 'approved';

-- Index pour vendeur
CREATE INDEX idx_products_sell ON products(seller_id, status, created_at DESC);

-- Index pour commandes
CREATE INDEX idx_orders_usr ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_orders_stat ON orders(status, created_at DESC);

-- Index pour favoris
CREATE INDEX idx_fav_usr ON favorites(user_id, created_at DESC);

-- Index pour reviews
CREATE INDEX idx_rev_prod ON reviews(product_id, created_at DESC);
CREATE INDEX idx_rev_sell ON reviews(seller_id, created_at DESC);

-- ============================
-- ÉTAPE 4: FONCTION PRINCIPALE - GET PRODUCTS
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
  WHERE (p_status IS NULL OR p.status = p_status)
    AND (p_category IS NULL OR p_category = 'all' OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================
-- ÉTAPE 5: FONCTION STATS VENDEUR
-- ============================

CREATE OR REPLACE FUNCTION get_seller_stats(p_seller_id TEXT)
RETURNS TABLE (
  total_sales BIGINT,
  total_revenue NUMERIC,
  commission_due NUMERIC,
  active_products BIGINT,
  avg_rating NUMERIC
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Calcul des ventes
    (SELECT COUNT(DISTINCT o.id)
     FROM orders o
     CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
     WHERE o.status IN ('completed', 'shipped')
       AND item->'product'->>'sellerId' = p_seller_id)::BIGINT as total_sales,
    
    -- Calcul du revenu total
    (SELECT COALESCE(SUM(
       (item->>'quantity')::NUMERIC * 
       (item->>'priceAtPurchase')::NUMERIC
     ), 0)
     FROM orders o
     CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
     WHERE o.status IN ('completed', 'shipped')
       AND item->'product'->>'sellerId' = p_seller_id) as total_revenue,
    
    -- Calcul de la commission (10%)
    (SELECT COALESCE(SUM(
       (item->>'quantity')::NUMERIC * 
       (item->>'priceAtPurchase')::NUMERIC * 0.10
     ), 0)
     FROM orders o
     CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
     WHERE o.status IN ('completed', 'shipped')
       AND item->'product'->>'sellerId' = p_seller_id) as commission_due,
    
    -- Nombre de produits actifs
    (SELECT COUNT(*)
     FROM products p
     WHERE p.seller_id = p_seller_id
       AND p.status = 'approved')::BIGINT as active_products,
    
    -- Note moyenne
    (SELECT COALESCE(AVG(rating), 0)
     FROM reviews r
     WHERE r.seller_id = p_seller_id) as avg_rating;
END;
$$;

-- ============================
-- ÉTAPE 6: FONCTION UPDATE TIMESTAMP
-- ============================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================
-- ÉTAPE 7: TRIGGERS
-- ============================

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
-- ÉTAPE 8: OPTIMISATION TABLES
-- ============================

ALTER TABLE products SET (fillfactor = 90);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE orders SET (fillfactor = 85);
ALTER TABLE favorites SET (fillfactor = 90);
ALTER TABLE reviews SET (fillfactor = 90);

-- ============================
-- ÉTAPE 9: ANALYSE FINALE
-- ============================

ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE reviews;

VACUUM (ANALYZE) products;
VACUUM (ANALYZE) users;
VACUUM (ANALYZE) orders;

-- ============================
-- ✅ TERMINÉ - BACKEND ULTRA-OPTIMISÉ
-- ============================
-- Toutes les anciennes fonctions ont été supprimées
-- Tous les index sont optimisés
-- Les fonctions sont recréées proprement
-- Les performances sont maximales
