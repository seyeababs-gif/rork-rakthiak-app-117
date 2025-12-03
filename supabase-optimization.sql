-- Script d'optimisation et de nettoyage de la base de données

-- ============================================
-- 1. AJOUT D'INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================

-- Index sur les produits
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, status);

-- Index sur les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_premium_pending ON users(premium_payment_pending) WHERE premium_payment_pending = true;

-- Index sur les commandes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Index sur les favoris
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_unique ON favorites(user_id, product_id);

-- Index sur les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Index sur les avis
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);

-- ============================================
-- 2. NETTOYAGE DES DONNÉES OBSOLÈTES
-- ============================================

-- Supprimer les notifications lues de plus de 30 jours
DELETE FROM notifications 
WHERE is_read = true 
AND created_at < NOW() - INTERVAL '30 days';

-- Supprimer les produits rejetés de plus de 90 jours
DELETE FROM products 
WHERE status = 'rejected' 
AND rejected_at < NOW() - INTERVAL '90 days';

-- Supprimer les favoris pour les produits qui n'existent plus
DELETE FROM favorites 
WHERE product_id NOT IN (SELECT id FROM products);

-- ============================================
-- 3. OPTIMISATION DES REQUÊTES
-- ============================================

-- Mettre à jour les statistiques pour l'optimiseur de requêtes
ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;
ANALYZE notifications;
ANALYZE reviews;

-- ============================================
-- 4. CONTRAINTES ET VALIDATION DES DONNÉES
-- ============================================

-- Ajouter une contrainte pour s'assurer que le prix est positif
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_price_positive'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_price_positive 
    CHECK (price > 0);
  END IF;
END $$;

-- Ajouter une contrainte pour s'assurer que discount_percent est entre 0 et 100
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_discount_valid'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_discount_valid 
    CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
  END IF;
END $$;

-- ============================================
-- 5. VUES OPTIMISÉES
-- ============================================

-- Vue pour les produits avec le nombre de favoris
CREATE OR REPLACE VIEW products_with_stats AS
SELECT 
  p.*,
  COUNT(DISTINCT f.user_id) as favorite_count
FROM products p
LEFT JOIN favorites f ON p.id = f.product_id
GROUP BY p.id;

-- Vue pour les statistiques des vendeurs
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
  u.id as seller_id,
  u.name as seller_name,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_products,
  COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_products,
  AVG(CASE WHEN p.status = 'approved' THEN r.rating END) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN products p ON u.id = p.seller_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY u.id, u.name;

-- ============================================
-- 6. FONCTION POUR NETTOYER AUTOMATIQUEMENT
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les notifications lues de plus de 30 jours
  DELETE FROM notifications 
  WHERE is_read = true 
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Supprimer les produits rejetés de plus de 90 jours
  DELETE FROM products 
  WHERE status = 'rejected' 
  AND rejected_at < NOW() - INTERVAL '90 days';
  
  -- Supprimer les favoris orphelins
  DELETE FROM favorites 
  WHERE product_id NOT IN (SELECT id FROM products);
  
  RAISE NOTICE 'Nettoyage terminé avec succès';
END;
$$ LANGUAGE plpgsql;

-- Commentaire : Exécutez cette fonction périodiquement via un cron job
-- SELECT cleanup_old_data();
