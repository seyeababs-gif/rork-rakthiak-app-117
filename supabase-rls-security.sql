-- ============================================
-- RÈGLES DE SÉCURITÉ RLS (Row Level Security) AMÉLIORÉES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES POUR LA TABLE PRODUCTS
-- ============================================

-- Tout le monde peut voir les produits approuvés
CREATE POLICY "Public can view approved products" ON products
  FOR SELECT
  USING (status = 'approved');

-- Les vendeurs peuvent voir leurs propres produits
CREATE POLICY "Sellers can view own products" ON products
  FOR SELECT
  USING (seller_id = current_setting('app.current_user_id', true));

-- Les admins peuvent voir tous les produits
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Les utilisateurs connectés peuvent créer des produits
CREATE POLICY "Authenticated users can create products" ON products
  FOR INSERT
  WITH CHECK (seller_id = current_setting('app.current_user_id', true));

-- Les vendeurs peuvent modifier leurs propres produits
CREATE POLICY "Sellers can update own products" ON products
  FOR UPDATE
  USING (seller_id = current_setting('app.current_user_id', true))
  WITH CHECK (seller_id = current_setting('app.current_user_id', true));

-- Les vendeurs peuvent supprimer leurs propres produits
CREATE POLICY "Sellers can delete own products" ON products
  FOR DELETE
  USING (seller_id = current_setting('app.current_user_id', true));

-- Les admins peuvent modifier tous les produits (pour approbation/rejet)
CREATE POLICY "Admins can update all products" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- ============================================
-- POLITIQUES POUR LA TABLE USERS
-- ============================================

-- Tout le monde peut voir les informations publiques des utilisateurs (pour les vendeurs)
CREATE POLICY "Public can view user profiles" ON users
  FOR SELECT
  USING (true);

-- Les utilisateurs peuvent créer leur propre compte
CREATE POLICY "Anyone can create account" ON users
  FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true))
  WITH CHECK (id = current_setting('app.current_user_id', true));

-- Les super admins peuvent modifier tous les utilisateurs
CREATE POLICY "Super admins can update all users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND is_super_admin = true
    )
  );

-- Les super admins peuvent supprimer des utilisateurs (sauf eux-mêmes et autres super admins)
CREATE POLICY "Super admins can delete users" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.id = current_setting('app.current_user_id', true) 
      AND u1.is_super_admin = true
    )
    AND id != current_setting('app.current_user_id', true)
    AND is_super_admin = false
  );

-- ============================================
-- POLITIQUES POUR LA TABLE ORDERS
-- ============================================

-- Les utilisateurs peuvent voir leurs propres commandes
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- Les vendeurs peuvent voir les commandes contenant leurs produits
CREATE POLICY "Sellers can view orders with their products" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(items) as item
      WHERE (item->'product'->>'seller_id')::text = current_setting('app.current_user_id', true)
    )
  );

-- Les admins peuvent voir toutes les commandes
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Les utilisateurs connectés peuvent créer des commandes
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent modifier leurs propres commandes (statut de paiement)
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Les admins peuvent modifier toutes les commandes
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- Les admins peuvent supprimer des commandes
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- ============================================
-- POLITIQUES POUR LA TABLE FAVORITES
-- ============================================

-- Les utilisateurs peuvent voir leurs propres favoris
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent ajouter des favoris
CREATE POLICY "Authenticated users can add favorites" ON favorites
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent supprimer leurs propres favoris
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ============================================
-- POLITIQUES POUR LA TABLE NOTIFICATIONS
-- ============================================

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent modifier leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Le système peut créer des notifications pour n'importe quel utilisateur
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ============================================
-- POLITIQUES POUR LA TABLE REVIEWS
-- ============================================

-- Tout le monde peut voir les avis
CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT
  USING (true);

-- Les utilisateurs connectés peuvent créer des avis
CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent modifier leurs propres avis
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Les utilisateurs peuvent supprimer leurs propres avis
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Les admins peuvent supprimer n'importe quel avis
CREATE POLICY "Admins can delete any review" ON reviews
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id', true) 
      AND (is_admin = true OR is_super_admin = true)
    )
  );

-- ============================================
-- FONCTION HELPER POUR DÉFINIR L'UTILISATEUR ACTUEL
-- ============================================

-- Note: Dans votre application, vous devez définir l'utilisateur actuel comme ceci:
-- await supabase.rpc('set_current_user', { user_id: currentUser.id })

CREATE OR REPLACE FUNCTION set_current_user(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

-- 1. Avant chaque requête, définissez l'utilisateur actuel:
--    await supabase.rpc('set_current_user', { user_id: currentUser.id })

-- 2. Les politiques RLS sont automatiquement appliquées à toutes les requêtes

-- 3. Pour désactiver temporairement RLS (développement uniquement):
--    ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- 4. Pour réactiver RLS:
--    ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
