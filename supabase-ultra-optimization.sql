-- Ultra Optimisation pour chargement instantané
-- Indexes composés pour requêtes fréquentes

-- Index pour les produits approuvés triés par date
CREATE INDEX IF NOT EXISTS idx_products_approved_created 
ON products(status, created_at DESC) 
WHERE status = 'approved';

-- Index pour les produits par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category_status_created 
ON products(category, status, created_at DESC);

-- Index pour les services par date de départ
CREATE INDEX IF NOT EXISTS idx_products_listing_departure 
ON products(listing_type, service_details->>'departureDate')
WHERE listing_type = 'service';

-- Index pour les favoris par utilisateur
CREATE INDEX IF NOT EXISTS idx_favorites_user_product 
ON favorites(user_id, product_id);

-- Index pour les commandes par utilisateur et statut
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);

-- Index pour les commandes en attente (admin)
CREATE INDEX IF NOT EXISTS idx_orders_pending_status 
ON orders(status, created_at DESC)
WHERE status IN ('pending_payment', 'paid');

-- Index pour les produits en attente d'approbation
CREATE INDEX IF NOT EXISTS idx_products_pending_created 
ON products(status, created_at DESC)
WHERE status = 'pending';

-- Index pour la recherche de texte sur les produits
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('french', title || ' ' || description))
WHERE status = 'approved';

-- Index pour les utilisateurs premium en attente
CREATE INDEX IF NOT EXISTS idx_users_premium_pending 
ON users(premium_payment_pending, premium_request_date)
WHERE premium_payment_pending = true;

-- Index partiel pour les produits avec réduction
CREATE INDEX IF NOT EXISTS idx_products_discount 
ON products(has_discount, discount_percent, status)
WHERE has_discount = true AND status = 'approved';

-- Optimisation des statistiques de la base
ANALYZE products;
ANALYZE users;
ANALYZE orders;
ANALYZE favorites;

-- Configuration pour améliorer les performances des requêtes
ALTER TABLE products SET (fillfactor = 90);
ALTER TABLE users SET (fillfactor = 90);
ALTER TABLE orders SET (fillfactor = 85);

-- Vacuum pour récupérer l'espace et optimiser
VACUUM ANALYZE products;
VACUUM ANALYZE users;
VACUUM ANALYZE orders;
VACUUM ANALYZE favorites;
