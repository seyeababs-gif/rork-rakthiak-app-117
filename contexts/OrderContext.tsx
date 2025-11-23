import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Order, OrderStatus, User, CartItem } from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/contexts/NotificationContext';

export const [OrderProvider, useOrders] = createContextHook(() => {
  const notifications = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading orders:', error.message || error);
        throw new Error(error.message || 'Failed to load orders');
      }

      if (data) {
        const mappedOrders: Order[] = data.map((o: any) => ({
          id: o.id,
          userId: o.user_id,
          userName: o.user_name,
          userPhone: o.user_phone,
          items: o.items,
          totalAmount: parseFloat(o.total_amount),
          status: o.status as OrderStatus,
          paymentMethod: o.payment_method as 'wave',
          waveTransactionId: o.wave_transaction_id,
          createdAt: new Date(o.created_at),
          paidAt: o.paid_at ? new Date(o.paid_at) : undefined,
          validatedAt: o.validated_at ? new Date(o.validated_at) : undefined,
          rejectedAt: o.rejected_at ? new Date(o.rejected_at) : undefined,
          rejectionReason: o.rejection_reason,
          shippedAt: o.shipped_at ? new Date(o.shipped_at) : undefined,
          completedAt: o.completed_at ? new Date(o.completed_at) : undefined,
          hasReview: o.has_review,
          deliveryName: o.delivery_name,
          deliveryPhone: o.delivery_phone,
          deliveryAddress: o.delivery_address,
          deliveryCity: o.delivery_city,
        }));
        setOrders(mappedOrders);
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('Error loading orders:', errorMsg);
      alert('Error loading orders: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = useCallback(async (
    cartItems: CartItem[], 
    user: User, 
    waveTransactionId?: string,
    deliveryInfo?: { name: string; phone: string; address: string; city: string }
  ) => {
    try {
      const newOrderData = {
        id: `order-${Date.now()}`,
        user_id: user.id,
        user_name: user.name,
        user_phone: user.phone,
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
        total_amount: cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
        status: waveTransactionId ? 'paid' : 'pending_payment',
        payment_method: 'wave',
        wave_transaction_id: waveTransactionId,
        paid_at: waveTransactionId ? new Date().toISOString() : null,
        delivery_name: deliveryInfo?.name || user.name,
        delivery_phone: deliveryInfo?.phone || user.phone,
        delivery_address: deliveryInfo?.address || user.deliveryAddress || '',
        delivery_city: deliveryInfo?.city || user.deliveryCity || '',
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrderData])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return null;
      }

      if (data) {
        const newOrder: Order = {
          id: data.id,
          userId: data.user_id,
          userName: data.user_name,
          userPhone: data.user_phone,
          items: data.items,
          totalAmount: parseFloat(data.total_amount),
          status: data.status as OrderStatus,
          paymentMethod: data.payment_method as 'wave',
          waveTransactionId: data.wave_transaction_id,
          createdAt: new Date(data.created_at),
          paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
          deliveryName: data.delivery_name,
          deliveryPhone: data.delivery_phone,
          deliveryAddress: data.delivery_address,
          deliveryCity: data.delivery_city,
        };
        
        setOrders([newOrder, ...orders]);
        return newOrder;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, additionalData?: { rejectionReason?: string }) => {
    try {
      const updateData: any = { status };
      
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (status === 'validated') {
        updateData.validated_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = additionalData?.rejectionReason;
      } else if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      const order = orders.find(o => o.id === orderId);
      if (order) {
        if (status === 'paid') {
          await notifications.sendNotificationToAdmins({
            type: 'order_paid',
            title: 'Commande payée',
            message: `${order.userName} a confirmé le paiement de la commande #${orderId.slice(-8)}`,
            data: { orderId, userId: order.userId },
          });
        } else if (status === 'validated') {
          await notifications.sendNotification(order.userId, {
            type: 'order_validated',
            title: 'Commande validée',
            message: `Votre commande #${orderId.slice(-8)} a été validée par l'administrateur`,
            data: { orderId },
          });
        } else if (status === 'rejected') {
          await notifications.sendNotification(order.userId, {
            type: 'order_rejected',
            title: 'Commande rejetée',
            message: `Votre commande #${orderId.slice(-8)} a été rejetée: ${additionalData?.rejectionReason || 'Aucune raison fournie'}`,
            data: { orderId, reason: additionalData?.rejectionReason },
          });
        } else if (status === 'shipped') {
          await notifications.sendNotification(order.userId, {
            type: 'order_shipped',
            title: 'Commande expédiée',
            message: `Votre commande #${orderId.slice(-8)} a été expédiée`,
            data: { orderId },
          });
        } else if (status === 'completed') {
          await notifications.sendNotification(order.userId, {
            type: 'order_completed',
            title: 'Commande livrée',
            message: `Votre commande #${orderId.slice(-8)} a été livrée`,
            data: { orderId },
          });
        }
      }

      setOrders(orders.map(order => {
        if (order.id === orderId) {
          const updates: Partial<Order> = { status };
          
          if (status === 'paid' && !order.paidAt) {
            updates.paidAt = new Date();
          } else if (status === 'validated') {
            updates.validatedAt = new Date();
          } else if (status === 'rejected') {
            updates.rejectedAt = new Date();
            updates.rejectionReason = additionalData?.rejectionReason;
          } else if (status === 'shipped') {
            updates.shippedAt = new Date();
          } else if (status === 'completed') {
            updates.completedAt = new Date();
          }
          
          return { ...order, ...updates };
        }
        return order;
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }, [orders]);

  const getUserOrders = useCallback((userId: string) => {
    return orders.filter(order => order.userId === userId);
  }, [orders]);

  const getPendingOrders = useCallback(() => {
    return orders.filter(order => order.status === 'paid');
  }, [orders]);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  return useMemo(() => ({
    orders,
    isLoading,
    createOrder,
    updateOrderStatus,
    getUserOrders,
    getPendingOrders,
    getOrderById,
  }), [orders, isLoading, createOrder, updateOrderStatus, getUserOrders, getPendingOrders, getOrderById]);
});
