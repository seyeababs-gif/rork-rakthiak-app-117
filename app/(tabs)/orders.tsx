import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, Star, ChevronDown } from 'lucide-react-native';
import { useOrders } from '@/contexts/OrderContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useReviews } from '@/contexts/ReviewContext';
import { OrderStatus, Order } from '@/types/marketplace';
import { router } from 'expo-router';
import ReviewModal from '@/components/ReviewModal';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { getUserOrders } = useOrders();
  const { currentUser, isAuthenticated } = useMarketplace();
  const { canReviewOrder, addReview } = useReviews();
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const userOrders = currentUser ? getUserOrders(currentUser.id) : [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'En attente paiement', color: '#FFA500', icon: Clock };
      case 'paid':
        return { label: 'En attente validation', color: '#3B82F6', icon: Clock };
      case 'validated':
        return { label: 'Validé', color: '#1E3A8A', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejeté', color: '#E31B23', icon: XCircle };
      case 'shipped':
        return { label: 'Expédié', color: '#8E44AD', icon: Truck };
      case 'completed':
        return { label: 'Terminé', color: '#27AE60', icon: CheckCircle };
    }
  };

  const filteredOrders = userOrders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.status === selectedFilter;
  });

  const getFilterCount = (filter: OrderStatus | 'all') => {
    if (filter === 'all') return userOrders.length;
    return userOrders.filter(order => order.status === filter).length;
  };

  const getProgressPercentage = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
      case 'paid':
        return 0;
      case 'validated':
        return 33;
      case 'shipped':
        return 66;
      case 'completed':
        return 100;
      case 'rejected':
        return 0;
    }
  };

  const renderProgressBar = (status: OrderStatus) => {
    const progress = getProgressPercentage(status);
    const isRejected = status === 'rejected';
    
    if (isRejected) return null;

    const steps = [
      { label: 'Validé', status: 'validated' },
      { label: 'Expédié', status: 'shipped' },
      { label: 'Livré', status: 'completed' },
    ];

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isActive = status === step.status || 
              (status === 'completed' && (step.status === 'validated' || step.status === 'shipped'));
            const isPassed = 
              (status === 'shipped' && step.status === 'validated') ||
              (status === 'completed' && (step.status === 'validated' || step.status === 'shipped'));

            return (
              <View key={index} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  (isActive || isPassed) && styles.stepDotActive
                ]}>
                  {step.status === 'shipped' && status === 'shipped' && (
                    <Truck size={12} color="#fff" />
                  )}
                  {step.status === 'shipped' && status === 'completed' && (
                    <CheckCircle size={12} color="#fff" />
                  )}
                  {step.status === 'validated' && (status === 'validated' || status === 'shipped' || status === 'completed') && (
                    <CheckCircle size={12} color="#fff" />
                  )}
                  {step.status === 'completed' && status === 'completed' && (
                    <CheckCircle size={12} color="#fff" />
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  (isActive || isPassed) && styles.stepLabelActive
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <Text style={styles.headerSubtitle}>Suivez vos achats</Text>
        </View>

        <View style={styles.notAuthContainer}>
          <Package size={64} color="#ccc" />
          <Text style={styles.notAuthTitle}>Connectez-vous</Text>
          <Text style={styles.notAuthSubtext}>
            Vous devez être connecté pour voir vos commandes
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Mes Commandes</Text>
        <Text style={styles.headerSubtitle}>{userOrders.length} commande(s)</Text>
      </View>

      <View style={styles.filterSelectorContainer}>
        <TouchableOpacity
          style={styles.filterSelector}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterSelectorLabel}>État:</Text>
          <Text style={styles.filterSelectorValue}>
            {selectedFilter === 'all' && 'Toutes'}
            {selectedFilter === 'pending_payment' && 'En attente'}
            {selectedFilter === 'paid' && 'Payées'}
            {selectedFilter === 'validated' && 'Validées'}
            {selectedFilter === 'shipped' && 'Expédiées'}
            {selectedFilter === 'completed' && 'Terminées'}
            {selectedFilter === 'rejected' && 'Rejetées'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <StatusIcon size={14} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemsContainer}>
                  {order.items.slice(0, 2).map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.product.title}
                        </Text>
                        <Text style={styles.itemQuantity}>Qté: {item.quantity}</Text>
                        <Text style={styles.itemPrice}>
                          {formatPrice(item.priceAtPurchase * item.quantity)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {order.items.length > 2 && (
                    <Text style={styles.moreItems}>
                      +{order.items.length - 2} autre(s) article(s)
                    </Text>
                  )}
                </View>

                {renderProgressBar(order.status)}

                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>{formatPrice(order.totalAmount)}</Text>
                  </View>
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>Détails</Text>
                    <ChevronRight size={18} color="#1E3A8A" />
                  </TouchableOpacity>
                </View>

                {currentUser && canReviewOrder(order, currentUser.id) && (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => {
                      setSelectedOrder(order);
                      setReviewModalVisible(true);
                    }}
                  >
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.reviewButtonText}>Laisser un avis</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'rejected' && order.rejectionReason && (
                  <View style={styles.rejectionReason}>
                    <XCircle size={16} color="#E31B23" />
                    <View style={styles.rejectionReasonContent}>
                      <Text style={styles.rejectionReasonLabel}>Raison du rejet:</Text>
                      <Text style={styles.rejectionReasonText}>{order.rejectionReason}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color="#ddd" />
            <Text style={styles.emptyStateText}>Aucune commande</Text>
            <Text style={styles.emptyStateSubtext}>
              Vos commandes apparaîtront ici après vos achats
            </Text>
          </View>
        )}
      </ScrollView>

      <ReviewModal
        visible={reviewModalVisible}
        order={selectedOrder}
        onClose={() => {
          setReviewModalVisible(false);
          setSelectedOrder(null);
        }}
        onSubmit={(rating, comment) => {
          if (currentUser && selectedOrder) {
            selectedOrder.items.forEach(item => {
              addReview(
                selectedOrder.id,
                item.product.id,
                item.product.sellerId,
                currentUser.id,
                currentUser.name,
                currentUser.avatar,
                rating,
                comment
              );
            });
          }
        }}
      />

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent}>
            <Text style={styles.filterModalTitle}>Filtrer par état</Text>
            {[
              { value: 'all', label: 'Toutes', count: getFilterCount('all') },
              { value: 'pending_payment', label: 'En attente', count: getFilterCount('pending_payment') },
              { value: 'paid', label: 'Payées', count: getFilterCount('paid') },
              { value: 'validated', label: 'Validées', count: getFilterCount('validated') },
              { value: 'shipped', label: 'Expédiées', count: getFilterCount('shipped') },
              { value: 'completed', label: 'Terminées', count: getFilterCount('completed') },
              { value: 'rejected', label: 'Rejetées', count: getFilterCount('rejected') },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterModalOption,
                  selectedFilter === option.value && styles.filterModalOptionActive
                ]}
                onPress={() => {
                  setSelectedFilter(option.value as OrderStatus | 'all');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterModalOptionText,
                  selectedFilter === option.value && styles.filterModalOptionTextActive
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.filterModalOptionCount,
                  selectedFilter === option.value && styles.filterModalOptionCountActive
                ]}>
                  {option.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  filterSelectorContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterSelectorValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  filterModalOptionActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  filterModalOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterModalOptionTextActive: {
    color: '#1E3A8A',
  },
  filterModalOptionCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#999',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  filterModalOptionCountActive: {
    color: '#1E3A8A',
    backgroundColor: '#BBDEFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  itemsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    resizeMode: 'cover' as const,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  moreItems: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E3A8A20',
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  rejectionReason: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E31B23',
  },
  rejectionReasonContent: {
    flex: 1,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E31B23',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  notAuthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  notAuthTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  notAuthSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  progressContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#1E3A8A',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600' as const,
  },
  stepLabelActive: {
    color: '#1E3A8A',
  },
});
