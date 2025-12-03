-- =========================================================
-- CORRECTION COMPLÈTE + OPTIMISATION ULTRA-RAPIDE
-- Ce fichier corrige toutes les erreurs et optimise le chargement
-- =========================================================

-- ============================
-- PARTIE 1: NETTOYAGE COMPLET
-- ============================

-- Supprimer les vues matérialisées qui référencent des tables inexistantes
DROP MATERIALIZED VIEW IF EXISTS mv_product_stats CASCADE;

-- Supprimer les triggers problématiques
DROP TRIGGER IF EXISTS trg_refresh_stats_on_product ON products;
DROP FUNCTION IF EXISTS refresh_product_stats();

-- Supprimer les index problématiques qui utilisent INCLUDE (non supporté par Supabase)
DROP INDEX IF EXISTS idx_products_homepage;

-- ============================
-- PARTIE 2: INDEX OPTIMISÉS (Sans INCLUDE)
-- ============================

-- Index composé ultra-rapide pour la page d'accueil
CREATE INDEX IF NOT EXISTS idx_products_homepage_optimized 
ON products(status, created_at DESC, category) 
WHERE status = 'approved';

-- Index pour les produits avec réduction
CREATE INDEX IF NOT EXISTS idx_products_discount_fast 
ON products(has_discount, discount_percent, status, created_at DESC)
WHERE has_discount = true AND status = 'approved';

-- Index pour la recherche full-text
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search 
ON products USING GIN(to_tsvector('french', title || ' ' || description))
WHERE status = 'approved';

-- Index pour filtrage par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category_optimized 
ON products(category, sub_category, status, created_at DESC)
WHERE status = 'approved';

-- Index pour les services
CREATE INDEX IF NOT EXISTS idx_products_services 
ON products(listing_type, status, created_at DESC)
WHERE listing_type = 'service' AND status = 'approved';

-- Index pour les favoris
DROP INDEX IF EXISTS idx_favorites_user_product;
CREATE INDEX idx_favorites_user_product 
ON favorites(user_id, product_id, created_at DESC);

-- Index pour les commandes utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_fast 
ON orders(user_id, status, created_at DESC);

-- Index pour les commandes par statut (admin)
CREATE INDEX IF NOT EXISTS idx_orders_status_fast 
ON orders(status, created_at DESC);

-- Index pour les produits en attente
CREATE INDEX IF NOT EXISTS idx_products_pending_fast 
ON products(status, created_at DESC)
WHERE status = 'pending';

-- Index pour les reviews par produit
CREATE INDEX IF NOT EXISTS idx_reviews_product_fast 
ON reviews(product_id, created_at DESC);

-- Index pour les reviews par vendeur
CREATE INDEX IF NOT EXISTS idx_reviews_seller_fast 
ON reviews(seller_id, created_at DESC);

-- ============================
-- PARTIE 3: FONCTIONS ULTRA-RAPIDES
-- ============================

-- Fonction optimisée pour récupérer les produits de la page d'accueil
CREATE OR REPLACE FUNCTION get_homepage_products(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_sub_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
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
  original_price NUMERIC,
  average_rating NUMERIC,
  review_count INTEGER
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
    p.original_price,
    p.average_rating,
    p.review_count
  FROM products p
  WHERE p.status = 'approved'
    AND (p_category IS NULL OR p_category = 'all' OR p.category = p_category)
    AND (p_sub_category IS NULL OR p_sub_category = 'all' OR p.sub_category = p_sub_category)
    AND (p_search IS NULL OR p.title ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir les statistiques vendeur
CREATE OR REPLACE FUNCTION get_seller_stats(p_seller_id TEXT)
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  total_sales BIGINT,
  total_revenue NUMERIC,
  commission_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_products,
    COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_products,
    COUNT(DISTINCT CASE 
      WHEN o.status IN ('completed', 'shipped') 
        AND (o.items::jsonb @> jsonb_build_array(jsonb_build_object('product', jsonb_build_object('sellerId', p_seller_id))))
      THEN o.id 
    END) as total_sales,
    COALESCE(SUM(CASE 
      WHEN o.status IN ('completed', 'shipped')
        AND (o.items::jsonb @> jsonb_build_array(jsonb_build_object('product', jsonb_build_object('sellerId', p_seller_id))))
      THEN (
        SELECT SUM((item->>'quantity')::numeric * (item->>'priceAtPurchase')::numeric)
        FROM jsonb_array_elements(o.items) as item
        WHERE item->'product'->>'sellerId' = p_seller_id
      )
    END), 0) as total_revenue,
    COALESCE(SUM(CASE 
      WHEN o.status IN ('completed', 'shipped')
        AND (o.items::jsonb @> jsonb_build_array(jsonb_build_object('product', jsonb_build_object('sellerId', p_seller_id))))
      THEN (
        SELECT SUM((item->>'quantity')::numeric * (item->>'priceAtPurchase')::numeric * 0.10)
        FROM jsonb_array_elements(o.items) as item
        WHERE item->'product'->>'sellerId' = p_seller_id
      )
    END), 0) as commission_amount
  FROM products p
  LEFT JOIN orders o ON o.items::text LIKE '%' || p.id || '%'
  WHERE p.seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================
-- PARTIE 4: OPTIMISATION BASE
-- ============================

-- Optimiser le fillfactor pour les tables à lecture intensive
ALTER TABLE products SET (fillfactor = 90);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE orders SET (fillfactor = 85);
ALTER TABLE favorites SET (fillfactor = 90);

-- Analyser toutes les tables pour mettre à jour les statistiques
ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE reviews;
ANALYZE messages;

-- Vacuum pour optimiser
VACUUM (ANALYZE, VERBOSE) products;
VACUUM (ANALYZE, VERBOSE) users;
VACUUM (ANALYZE, VERBOSE) orders;

-- ============================
-- PARTIE 5: TRIGGERS POUR MISE À JOUR AUTO
-- ============================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- NOTES D'OPTIMISATION
-- ============================
-- ✅ Tous les index sont optimisés pour les requêtes fréquentes
-- ✅ Pas d'utilisation de INCLUDE (non supporté)
-- ✅ Pas de référence à order_items (n'existe pas)
-- ✅ Fonctions PL/pgSQL pour des requêtes complexes rapides
-- ✅ Indexes partiels pour réduire la taille
-- ✅ ANALYZE et VACUUM pour optimiser les performances

-- VÉRIFICATION DES PERFORMANCES:
-- EXPLAIN ANALYZE SELECT * FROM get_homepage_products(20, 0, NULL, NULL, NULL);
