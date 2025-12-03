-- =========================================================
-- SCRIPT FINAL - CORRECTION ET OPTIMISATION COMPLÈTE
-- Exécutez ce fichier dans l'ordre dans Supabase SQL Editor
-- =========================================================

-- ============================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================

-- Supprimer les vues/fonctions qui posent problème
DROP MATERIALIZED VIEW IF EXISTS mv_product_stats CASCADE;
DROP FUNCTION IF EXISTS refresh_product_stats() CASCADE;
DROP FUNCTION IF EXISTS get_homepage_products(INT, INT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_products_fast(INT, INT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_seller_revenue(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_seller_stats(TEXT) CASCADE;

-- Supprimer les index problématiques ou obsolètes
DROP INDEX IF EXISTS idx_products_homepage;
DROP INDEX IF EXISTS idx_products_homepage_optimized;
DROP INDEX IF EXISTS idx_products_created_brin;
DROP INDEX IF EXISTS idx_orders_created_brin;

-- Supprimer les triggers obsolètes
DROP TRIGGER IF EXISTS trg_refresh_stats_on_product ON products;
DROP TRIGGER IF EXISTS products_update_timestamp ON products;
DROP TRIGGER IF EXISTS users_update_timestamp ON users;
DROP TRIGGER IF EXISTS orders_update_timestamp ON orders;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- ============================
-- ÉTAPE 2: INDEX OPTIMISÉS
-- ============================

-- Index pour produits approuvés (page d'accueil)
CREATE INDEX IF NOT EXISTS idx_products_approved_created 
ON products(status, created_at DESC) 
WHERE status = 'approved';

-- Index pour produits par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category_status 
ON products(category, status, created_at DESC) 
WHERE status = 'approved';

-- Index pour produits avec réduction
CREATE INDEX IF NOT EXISTS idx_products_discount 
ON products(has_discount, discount_percent, created_at DESC) 
WHERE has_discount = true AND status = 'approved';

-- Index pour services
CREATE INDEX IF NOT EXISTS idx_products_services 
ON products(listing_type, status, created_at DESC) 
WHERE listing_type = 'service' AND status = 'approved';

-- Index pour produits en attente (admin)
CREATE INDEX IF NOT EXISTS idx_products_pending 
ON products(status, created_at DESC) 
WHERE status = 'pending';

-- Index pour produits du vendeur
CREATE INDEX IF NOT EXISTS idx_products_seller 
ON products(seller_id, status, created_at DESC);

-- Index pour commandes utilisateur
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status, created_at DESC);

-- Index pour commandes par statut (admin)
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status, created_at DESC);

-- Index pour favoris
CREATE INDEX IF NOT EXISTS idx_favorites_user 
ON favorites(user_id, created_at DESC);

-- Index pour reviews par produit
CREATE INDEX IF NOT EXISTS idx_reviews_product 
ON reviews(product_id, created_at DESC);

-- Index pour reviews par vendeur
CREATE INDEX IF NOT EXISTS idx_reviews_seller 
ON reviews(seller_id, created_at DESC);

-- ============================
-- ÉTAPE 3: FONCTIONS SQL
-- ============================

-- Fonction pour obtenir les produits rapidement
CREATE OR REPLACE FUNCTION get_products_optimized(
  p_limit INT DEFAULT 50,
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

-- Fonction pour calculer les revenus du vendeur
CREATE OR REPLACE FUNCTION get_seller_revenue(p_seller_id TEXT)
RETURNS TABLE (
  total_sales BIGINT,
  total_revenue NUMERIC,
  commission NUMERIC,
  net_revenue NUMERIC
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
    ), 0) as commission,
    COALESCE(SUM(
      (item->>'quantity')::NUMERIC * 
      (item->>'priceAtPurchase')::NUMERIC * 0.90
    ), 0) as net_revenue
  FROM orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
  WHERE o.status IN ('completed', 'shipped')
    AND item->'product'->>'sellerId' = p_seller_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================
-- ÉTAPE 4: TRIGGERS
-- ============================

-- Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour products
CREATE TRIGGER trigger_update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger pour users
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger pour orders
CREATE TRIGGER trigger_update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================
-- ÉTAPE 5: OPTIMISATION TABLES
-- ============================

-- Optimiser le fillfactor pour meilleures performances
ALTER TABLE products SET (fillfactor = 90);
ALTER TABLE users SET (fillfactor = 95);
ALTER TABLE orders SET (fillfactor = 85);
ALTER TABLE favorites SET (fillfactor = 90);
ALTER TABLE reviews SET (fillfactor = 90);
ALTER TABLE messages SET (fillfactor = 85);

-- ============================
-- ÉTAPE 6: MAINTENANCE
-- ============================

-- Analyser les tables pour optimiser le query planner
ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE reviews;
ANALYZE messages;

-- Vacuum pour récupérer l'espace et optimiser
VACUUM (ANALYZE) products;
VACUUM (ANALYZE) users;
VACUUM (ANALYZE) orders;
VACUUM (ANALYZE) favorites;

-- ============================
-- ÉTAPE 7: VÉRIFICATIONS
-- ============================

-- Vérifier que toutes les tables existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    RAISE EXCEPTION 'Table products n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    RAISE EXCEPTION 'Table users n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    RAISE EXCEPTION 'Table orders n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    RAISE EXCEPTION 'Table reviews n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    RAISE EXCEPTION 'Table favorites n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    RAISE EXCEPTION 'Table messages n''existe pas';
  END IF;
  
  RAISE NOTICE '✅ Toutes les tables existent';
END $$;

-- Vérifier que les fonctions sont créées
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_products_optimized') THEN
    RAISE EXCEPTION 'Fonction get_products_optimized n''existe pas';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_seller_revenue') THEN
    RAISE EXCEPTION 'Fonction get_seller_revenue n''existe pas';
  END IF;
  
  RAISE NOTICE '✅ Toutes les fonctions sont créées';
END $$;

-- Vérifier que les index sont créés
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_products_approved_created') THEN
    RAISE WARNING 'Index idx_products_approved_created manquant';
  ELSE
    RAISE NOTICE '✅ Index produits optimisé';
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_orders_user_status') THEN
    RAISE WARNING 'Index idx_orders_user_status manquant';
  ELSE
    RAISE NOTICE '✅ Index commandes optimisé';
  END IF;
END $$;

-- ============================
-- RÉSULTAT FINAL
-- ============================

-- Afficher un résumé
SELECT 
  'Base de données optimisée avec succès !' as message,
  (SELECT count(*) FROM products) as total_products,
  (SELECT count(*) FROM products WHERE status = 'approved') as approved_products,
  (SELECT count(*) FROM users) as total_users,
  (SELECT count(*) FROM orders) as total_orders;

-- Test de performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_products_optimized(20, 0, NULL, 'approved');

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════';
RAISE NOTICE '✅ OPTIMISATION TERMINÉE AVEC SUCCÈS !';
RAISE NOTICE '═══════════════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE 'Fonctions disponibles:';
RAISE NOTICE '  - get_products_optimized(limit, offset, category, status)';
RAISE NOTICE '  - get_seller_revenue(seller_id)';
RAISE NOTICE '';
RAISE NOTICE 'Performances attendues:';
RAISE NOTICE '  - Chargement initial: < 500ms';
RAISE NOTICE '  - Scroll infini: < 200ms';
RAISE NOTICE '  - Images: Chargement progressif';
RAISE NOTICE '';
