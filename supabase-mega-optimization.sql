-- MEGA OPTIMISATION pour un chargement ultra rapide
-- Cette optimisation est conçue pour rivaliser avec les sites majeurs

-- ======================================
-- PARTIE 1: Index Ultra-Performants
-- ======================================

-- Index BRIN pour les colonnes de timestamp (très performant pour les données triées)
CREATE INDEX IF NOT EXISTS idx_products_created_brin 
ON products USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_orders_created_brin 
ON orders USING BRIN (created_at);

-- Index composé pour la page d'accueil (query la plus importante)
DROP INDEX IF EXISTS idx_products_homepage;
CREATE INDEX idx_products_homepage 
ON products(status, created_at DESC, category)
WHERE status = 'approved'
INCLUDE (title, price, images, location, has_discount, discount_percent, original_price);

-- Index pour les services avec détails
CREATE INDEX IF NOT EXISTS idx_products_services_optimized 
ON products(listing_type, status, (service_details->>'departureDate'))
WHERE listing_type = 'service' AND status = 'approved';

-- Index pour recherche full-text ultra-rapide
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search 
ON products USING GIN(to_tsvector('french', title || ' ' || description))
WHERE status = 'approved';

-- Index pour filtrage par catégorie et sous-catégorie
CREATE INDEX IF NOT EXISTS idx_products_category_filter 
ON products(category, sub_category, status, created_at DESC)
WHERE status = 'approved';

-- Index pour produits en promotion
CREATE INDEX IF NOT EXISTS idx_products_discount_active 
ON products(has_discount, discount_percent DESC, created_at DESC)
WHERE has_discount = true AND status = 'approved';

-- Index pour favoris user
DROP INDEX IF EXISTS idx_favorites_user_product;
CREATE INDEX idx_favorites_user_product 
ON favorites(user_id, product_id)
INCLUDE (created_at);

-- Index pour commandes utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_optimized 
ON orders(user_id, status, created_at DESC)
INCLUDE (total_amount, payment_method);

-- ======================================
-- PARTIE 2: Vues Matérialisées
-- ======================================

-- Vue matérialisée pour statistiques produits
DROP MATERIALIZED VIEW IF EXISTS mv_product_stats;
CREATE MATERIALIZED VIEW mv_product_stats AS
SELECT 
  p.id,
  p.title,
  p.price,
  p.images[1] as first_image,
  p.category,
  p.status,
  p.created_at,
  p.seller_id,
  p.has_discount,
  p.discount_percent,
  p.original_price,
  COUNT(DISTINCT f.user_id) as favorite_count,
  COUNT(DISTINCT o.id) as order_count
FROM products p
LEFT JOIN favorites f ON f.product_id = p.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('delivered', 'in_delivery')
WHERE p.status = 'approved'
GROUP BY p.id;

CREATE INDEX ON mv_product_stats(category, created_at DESC);
CREATE INDEX ON mv_product_stats(favorite_count DESC);

-- ======================================
-- PARTIE 3: Configuration Performance
-- ======================================

-- Augmenter le fillfactor pour les tables à lecture intensive
ALTER TABLE products SET (fillfactor = 95);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE favorites SET (fillfactor = 90);
ALTER TABLE orders SET (fillfactor = 85);

-- Désactiver autovacuum sur les petites tables (optimisation lecture)
ALTER TABLE categories SET (autovacuum_enabled = false);

-- ======================================
-- PARTIE 4: Fonctions Optimisées
-- ======================================

-- Fonction pour récupérer les produits de la page d'accueil (ultra-optimisée)
CREATE OR REPLACE FUNCTION get_homepage_products(
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_sub_category TEXT DEFAULT NULL
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
  WHERE p.status = 'approved'
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_sub_category IS NULL OR p.sub_category = p_sub_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ======================================
-- PARTIE 5: Maintenance et Nettoyage
-- ======================================

-- Rafraîchir les vues matérialisées
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats;

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE order_items;
ANALYZE notifications;

-- Vacuum complet pour optimiser l'espace
VACUUM (ANALYZE, VERBOSE) products;
VACUUM (ANALYZE, VERBOSE) users;
VACUUM (ANALYZE, VERBOSE) orders;
VACUUM (ANALYZE, VERBOSE) favorites;

-- ======================================
-- PARTIE 6: Configuration Serveur
-- ======================================

-- Ces commandes nécessitent les droits superuser
-- À exécuter manuellement si vous avez accès

-- Augmenter le cache partagé
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Augmenter le work_mem pour les requêtes complexes
-- ALTER SYSTEM SET work_mem = '16MB';

-- Activer le parallel query
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Augmenter le buffer effectif
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- pg_reload_conf();

-- ======================================
-- PARTIE 7: Triggers pour maintenir les stats
-- ======================================

-- Fonction pour rafraîchir les stats automatiquement
CREATE OR REPLACE FUNCTION refresh_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour rafraîchir après insertion de produit
DROP TRIGGER IF EXISTS trg_refresh_stats_on_product ON products;
CREATE TRIGGER trg_refresh_stats_on_product
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_stats();

-- ======================================
-- NOTES D'OPTIMISATION
-- ======================================
-- 1. Les index BRIN sont parfaits pour les colonnes triées (created_at)
-- 2. Les index INCLUDE permettent de faire des index-only scans
-- 3. Les vues matérialisées cachent les calculs coûteux
-- 4. Le fillfactor élevé réduit la fragmentation pour les lectures
-- 5. Les fonctions PL/pgSQL sont compilées et très rapides

-- Pour vérifier les performances:
-- EXPLAIN ANALYZE SELECT * FROM products WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20;
