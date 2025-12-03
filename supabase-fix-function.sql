-- ============================================
-- FIX: Supprimer et recréer get_seller_stats
-- ============================================

-- Supprimer toutes les versions de la fonction
DROP FUNCTION IF EXISTS get_seller_stats(TEXT) CASCADE;

-- Recréer la fonction avec la bonne signature
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
