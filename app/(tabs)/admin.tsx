import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  Clock, 
  Truck, 
  CheckCheck, 
  ShieldAlert,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  Crown,
  Shield,
  ShieldCheck,
  ChevronDown,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useOrders } from '@/contexts/OrderContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useToast } from '@/contexts/ToastContext';
import { Order, OrderStatus, Product, User } from '@/types/marketplace';

import { 
  getDimensions,
  getProductCardWidth,
  isWeb,
  getContainerPadding,
  getButtonHeight,
  getButtonFontSize,
} from '@/constants/responsive';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

type TabType = 'orders' | 'products' | 'users' | 'settings';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { orders, updateOrderStatus, deleteOrder, deleteAllUserOrders } = useOrders();
  const toast = useToast();
  const { settings, updateSettings, isUpdating } = useGlobalSettings();
  const { 
    currentUser, 
    isAuthenticated, 
    pendingProducts,
    products,
    approveProduct,
    rejectProduct,
    deleteProduct,
    allUsers,
    changeUserType,
    deleteUser,
    approvePremiumUpgrade,
    rejectPremiumUpgrade,
    toggleAdminStatus,
  } = useMarketplace();
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all' | 'pending'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('products');
  
  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(settings.isGlobalPremiumEnabled);
  const [scrollingMessage, setScrollingMessage] = useState<string>(settings.scrollingMessage);
  const [commissionPercentage, setCommissionPercentage] = useState<string>(settings.commissionPercentage.toString());
  
  React.useEffect(() => {
    setPremiumEnabled(settings.isGlobalPremiumEnabled);
    setScrollingMessage(settings.scrollingMessage);
    setCommissionPercentage(settings.commissionPercentage.toString());
  }, [settings]);

  // Rejection Modal State
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    type: 'order' | 'product' | null;
    targetId: string | null;
    targetTitle?: string;
  }>({ visible: false, type: null, targetId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = currentUser?.isAdmin === true;
  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Accès Refusé', headerShown: true }} />
        <View style={styles.accessDeniedContainer}>
          <ShieldAlert size={64} color="#E31B23" />
          <Text style={styles.accessDeniedTitle}>Accès Refusé</Text>
          <Text style={styles.accessDeniedText}>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backButtonText}>Retour à l&apos;accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        return { label: 'Payé', color: '#00A651', icon: CheckCircle };
      case 'validated':
        return { label: 'Validé', color: '#007AFF', icon: CheckCheck };
      case 'rejected':
        return { label: 'Rejeté', color: '#E31B23', icon: XCircle };
      case 'shipped':
        return { label: 'Expédié', color: '#8E44AD', icon: Truck };
      case 'completed':
        return { label: 'Terminé', color: '#27AE60', icon: CheckCircle };
    }
  };

  const handleValidate = (orderId: string) => {
    toast.showAlert(
      'Valider la commande',
      'Êtes-vous sûr de vouloir valider cette commande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            await updateOrderStatus(orderId, 'validated');
            toast.showSuccess('La commande a été validée');
          },
        },
      ]
    );
  };

  const handleReject = (orderId: string) => {
    setRejectModal({
      visible: true,
      type: 'order',
      targetId: orderId,
      targetTitle: `Commande #${orderId.slice(-8)}`
    });
    setRejectionReason('');
  };

  const handleShip = (orderId: string) => {
    toast.showAlert(
      'Marquer comme expédié',
      'Cette commande a-t-elle été expédiée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Expédié',
          onPress: async () => {
            await updateOrderStatus(orderId, 'shipped');
            toast.showSuccess('La commande a été marquée comme expédiée');
          },
        },
      ]
    );
  };

  const handleComplete = (orderId: string) => {
    toast.showAlert(
      'Marquer comme livrée',
      'Cette commande a-t-elle été livrée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Livrée',
          onPress: async () => {
            await updateOrderStatus(orderId, 'completed');
            toast.showSuccess('La commande a été marquée comme livrée');
          },
        },
      ]
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    toast.showAlert(
      'Supprimer la commande',
      'Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteOrder(orderId);
            if (result.success) {
              toast.showSuccess('La commande a été supprimée');
            } else {
              toast.showError(result.error || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllUserOrders = (userId: string, userName: string) => {
    toast.showAlert(
      'Supprimer toutes les commandes',
      `Êtes-vous sûr de vouloir supprimer TOUTES les commandes de ${userName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer tout',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAllUserOrders(userId);
            if (result.success) {
              toast.showSuccess(`Toutes les commandes de ${userName} ont été supprimées`);
            } else {
              toast.showError(result.error || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleApproveProduct = (productId: string, productTitle: string) => {
    toast.showAlert(
      'Approuver le produit',
      `Voulez-vous approuver "${productTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            await approveProduct(productId);
            toast.showSuccess('Le produit a été approuvé et est maintenant visible');
          },
        },
      ]
    );
  };

  const handleRejectProduct = (productId: string, productTitle: string) => {
    setRejectModal({
      visible: true,
      type: 'product',
      targetId: productId,
      targetTitle: productTitle
    });
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectModal.targetId || !rejectModal.type) return;

    if (rejectModal.type === 'order') {
      await updateOrderStatus(rejectModal.targetId, 'rejected', { rejectionReason: rejectionReason || 'Non spécifié' });
      toast.showSuccess('La commande a été rejetée');
    } else if (rejectModal.type === 'product') {
      await rejectProduct(rejectModal.targetId, rejectionReason || 'Non conforme aux règles');
      toast.showSuccess('Le produit a été rejeté');
    }

    setRejectModal({ visible: false, type: null, targetId: null });
    setRejectionReason('');
  };

  const handleDeleteProduct = (productId: string, productTitle: string) => {
    toast.showAlert(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${productTitle}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(productId);
            toast.showSuccess('Le produit a été supprimé');
          },
        },
      ]
    );
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/product/edit/${productId}` as any);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return order.status === 'pending_payment' || order.status === 'paid';
    return order.status === selectedFilter;
  });

  const getFilterCount = (filter: OrderStatus | 'all' | 'pending') => {
    if (filter === 'all') return orders.length;
    if (filter === 'pending') return orders.filter(order => order.status === 'pending_payment' || order.status === 'paid').length;
    return orders.filter(order => order.status === filter).length;
  };

  const renderOrderCard = (order: Order) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Commande #{order.id.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <StatusIcon size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.userName}</Text>
          <Text style={styles.customerPhone}>{order.userPhone}</Text>
          {order.waveTransactionId && (
            <Text style={styles.transactionId}>Ref: {order.waveTransactionId}</Text>
          )}
        </View>

        <View style={styles.itemsContainer}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.product.title}
                </Text>
                <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPrice(order.totalAmount)}</Text>
        </View>

        {(order.status === 'pending_payment' || order.status === 'paid') && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.validateButton]}
              onPress={() => handleValidate(order.id)}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Valider paiement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(order.id)}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Rejeter</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'validated' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shipButton]}
            onPress={() => handleShip(order.id)}
          >
            <Truck size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Marquer comme expédié</Text>
          </TouchableOpacity>
        )}

        {order.status === 'shipped' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleComplete(order.id)}
          >
            <CheckCheck size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Marquer comme livrée</Text>
          </TouchableOpacity>
        )}

        {order.status === 'rejected' && order.rejectionReason && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionReasonLabel}>Raison du rejet:</Text>
            <Text style={styles.rejectionReasonText}>{order.rejectionReason}</Text>
          </View>
        )}

        {currentUser?.isSuperAdmin && (
          <TouchableOpacity
            style={styles.deleteOrderButton}
            onPress={() => handleDeleteOrder(order.id)}
          >
            <Trash2 size={18} color="#E31B23" />
            <Text style={styles.deleteOrderButtonText}>Supprimer cette commande</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProductCard = (product: Product) => {
    const getProductStatusInfo = () => {
      switch (product.status) {
        case 'pending':
          return { label: 'En attente', color: '#FFA500', icon: Clock };
        case 'approved':
          return { label: 'Approuvé', color: '#00A651', icon: CheckCircle };
        case 'rejected':
          return { label: 'Rejeté', color: '#E31B23', icon: XCircle };
      }
    };

    const statusInfo = getProductStatusInfo();
    const StatusIcon = statusInfo.icon;
    
    const hasDiscount = product.hasDiscount && product.discountPercent && product.discountPercent > 0;
    const displayPrice = hasDiscount && product.originalPrice 
      ? product.originalPrice * (1 - (product.discountPercent || 0) / 100)
      : product.price;

    return (
      <View key={product.id} style={styles.productCard}>
        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        <View style={[styles.productStatusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <StatusIcon size={12} color={statusInfo.color} />
          <Text style={[styles.productStatusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
        <View style={styles.productCardInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          {hasDiscount && product.originalPrice ? (
            <View style={styles.priceContainer}>
              <Text style={styles.productPriceDiscount}>{formatPrice(displayPrice)}</Text>
              <Text style={styles.productPriceOriginal}>{formatPrice(product.originalPrice)}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-{product.discountPercent}%</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          )}
          <Text style={styles.productSeller} numberOfLines={1}>
            Par {product.sellerName}
          </Text>
          <Text style={styles.productDate}>{formatDate(product.createdAt)}</Text>

          {product.status === 'pending' && (
            <View style={styles.productActionsRow}>
              <TouchableOpacity
                style={[styles.productActionButton, styles.approveProductButton]}
                onPress={() => handleApproveProduct(product.id, product.title)}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.productActionButtonText}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.productActionButton, styles.rejectProductButton]}
                onPress={() => handleRejectProduct(product.id, product.title)}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.productActionButtonText}>Rejeter</Text>
              </TouchableOpacity>
            </View>
          )}

          {product.status === 'rejected' && product.rejectionReason && (
            <View style={styles.productRejectionReason}>
              <AlertCircle size={12} color="#E31B23" />
              <Text style={styles.productRejectionReasonText} numberOfLines={2}>
                {product.rejectionReason}
              </Text>
            </View>
          )}

          <View style={styles.productAdminActions}>
            <TouchableOpacity
              style={styles.productAdminActionButton}
              onPress={() => handleViewProduct(product.id)}
            >
              <Text style={styles.productAdminActionButtonText}>Voir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.productAdminActionButton}
              onPress={() => handleEditProduct(product.id)}
            >
              <Edit size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.productAdminActionButton}
              onPress={() => handleDeleteProduct(product.id, product.title)}
            >
              <Trash2 size={16} color="#E31B23" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderOrdersTab = () => {
    return (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Package size={20} color="#00A651" />
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={20} color="#FFA500" />
          <Text style={styles.statValue}>{getFilterCount('pending')}</Text>
          <Text style={styles.statLabel}>À valider</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#007AFF" />
          <Text style={styles.statValue}>{getFilterCount('validated')}</Text>
          <Text style={styles.statLabel}>Validées</Text>
        </View>
      </View>

      <View style={styles.filterSelectorContainer}>
        <TouchableOpacity
          style={styles.filterSelector}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterSelectorLabel}>État:</Text>
          <Text style={styles.filterSelectorValue}>
            {selectedFilter === 'pending' && 'À valider'}
            {selectedFilter === 'all' && 'Toutes'}
            {selectedFilter === 'validated' && 'Validées'}
            {selectedFilter === 'shipped' && 'Expédiées'}
            {selectedFilter === 'rejected' && 'Rejetées'}
            {selectedFilter === 'completed' && 'Terminées'}
            {selectedFilter === 'paid' && 'Payées'}
            {selectedFilter === 'pending_payment' && 'En attente'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color="#ddd" />
            <Text style={styles.emptyStateText}>Aucune commande</Text>
            <Text style={styles.emptyStateSubtext}>
              Les commandes apparaîtront ici
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
    );
  };

  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Package size={20} color="#00A651" />
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={20} color="#FFA500" />
          <Text style={styles.statValue}>{pendingProducts.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#007AFF" />
          <Text style={styles.statValue}>
            {products.filter(p => p.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approuvés</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {products.length > 0 ? (
          <View style={styles.productsGrid}>
            {products.map(renderProductCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color="#ddd" />
            <Text style={styles.emptyStateText}>Aucun produit</Text>
            <Text style={styles.emptyStateSubtext}>
              Les produits apparaîtront ici
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const handleChangeUserType = (userId: string, userName: string, currentType: string) => {
    const newType = currentType === 'premium' ? 'standard' : 'premium';
    toast.showAlert(
      'Changer le type de compte',
      `Voulez-vous passer ${userName} en ${newType === 'premium' ? 'Premium' : 'Standard'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await changeUserType(userId, newType as 'premium' | 'standard');
            if (result.success) {
              toast.showSuccess(`Le compte de ${userName} est maintenant ${newType === 'premium' ? 'Premium' : 'Standard'}`);
            } else {
              toast.showError(result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    toast.showAlert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${userName} ? Cette action supprimera aussi toutes ses annonces.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUser(userId);
            if (result.success) {
              toast.showSuccess(`${userName} a été supprimé`);
            } else {
              toast.showError(result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleApprovePremium = (userId: string, userName: string) => {
    toast.showAlert(
      'Valider le passage Premium',
      `Voulez-vous activer le compte Premium de ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer Premium',
          onPress: async () => {
            const result = await approvePremiumUpgrade(userId);
            if (result.success) {
              toast.showSuccess(`Le compte Premium de ${userName} a été activé`);
            } else {
              toast.showError(result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleRejectPremium = (userId: string, userName: string) => {
    toast.showAlert(
      'Rejeter la demande Premium',
      `Voulez-vous rejeter la demande Premium de ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            const result = await rejectPremiumUpgrade(userId);
            if (result.success) {
              toast.showSuccess(`La demande Premium de ${userName} a été rejetée`);
            } else {
              toast.showError(result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const handleToggleAdmin = (userId: string, userName: string, isCurrentlyAdmin: boolean) => {
    if (!currentUser?.isSuperAdmin) {
      toast.showError('Seul le super administrateur peut gérer les admins');
      return;
    }

    toast.showAlert(
      isCurrentlyAdmin ? 'Retirer les droits admin' : 'Définir comme admin',
      `Voulez-vous ${isCurrentlyAdmin ? 'retirer les droits admin de' : 'faire de'} ${userName} ${isCurrentlyAdmin ? '' : 'un administrateur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const result = await toggleAdminStatus(userId);
            if (result.success) {
              toast.showSuccess(`${userName} ${isCurrentlyAdmin ? 'n\'est plus admin' : 'est maintenant admin'}`);
            } else {
              toast.showError(result.error || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const renderUserCard = (user: User) => {
    const userProductCount = products.filter(p => p.sellerId === user.id).length;
    const isCurrentUser = user.id === currentUser?.id;
    const isSuperAdmin = currentUser?.isSuperAdmin === true;

    return (
      <View key={user.id} style={styles.userCard}>
        <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
        <View style={styles.userCardInfo}>
          <View style={styles.userCardHeader}>
            <Text style={styles.userCardName} numberOfLines={1}>
              {user.name}
              {isCurrentUser && ' (Vous)'}
            </Text>
            {user.type === 'premium' && (
              <View style={styles.userPremiumBadge}>
                <Crown size={10} color="#FFD700" fill="#FFD700" />
              </View>
            )}
            {user.isSuperAdmin && (
              <View style={styles.userSuperAdminBadge}>
                <ShieldCheck size={10} color="#E31B23" fill="#E31B23" />
              </View>
            )}
            {user.isAdmin && !user.isSuperAdmin && (
              <View style={styles.userAdminBadge}>
                <Shield size={10} color="#007AFF" />
              </View>
            )}
            {user.premiumPaymentPending && (
              <View style={styles.userPendingBadge}>
                <Clock size={10} color="#FFA500" />
              </View>
            )}
          </View>
          <Text style={styles.userCardPhone}>{user.phone}</Text>
          <Text style={styles.userCardLocation} numberOfLines={1}>
            {user.location}
          </Text>
          <View style={styles.userCardStats}>
            <Package size={12} color="#00A651" />
            <Text style={styles.userCardStatsText}>{userProductCount} annonces</Text>
          </View>
          {user.premiumPaymentPending && (
            <View style={styles.premiumRequestBanner}>
              <AlertCircle size={12} color="#FFA500" />
              <Text style={styles.premiumRequestText}>Demande Premium en attente</Text>
            </View>
          )}
        </View>
        <View style={styles.userCardActions}>
          {user.premiumPaymentPending ? (
            <>
              <TouchableOpacity
                style={[styles.userActionButton, styles.userActionButtonApprove]}
                onPress={() => handleApprovePremium(user.id, user.name)}
              >
                <CheckCircle size={14} color="#00A651" />
                <Text style={[styles.userActionButtonText, styles.userActionButtonTextApprove]}>
                  Valider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.userActionButton, styles.userActionButtonReject]}
                onPress={() => handleRejectPremium(user.id, user.name)}
              >
                <XCircle size={14} color="#E31B23" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isSuperAdmin && !user.isSuperAdmin && (
                <TouchableOpacity
                  style={[
                    styles.userActionButton,
                    user.isAdmin ? styles.userActionButtonRemoveAdmin : styles.userActionButtonMakeAdmin
                  ]}
                  onPress={() => handleToggleAdmin(user.id, user.name, user.isAdmin || false)}
                >
                  <Shield size={14} color={user.isAdmin ? '#E31B23' : '#007AFF'} />
                  <Text style={[
                    styles.userActionButtonText,
                    user.isAdmin ? styles.userActionButtonTextRemoveAdmin : styles.userActionButtonTextMakeAdmin
                  ]}>
                    {user.isAdmin ? 'Retirer' : 'Admin'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.userActionButton,
                  user.type === 'premium' ? styles.userActionButtonStandard : styles.userActionButtonPremium
                ]}
                onPress={() => handleChangeUserType(user.id, user.name, user.type)}
              >
                <Crown size={14} color={user.type === 'premium' ? '#666' : '#FFD700'} />
                <Text style={[
                  styles.userActionButtonText,
                  user.type === 'premium' ? styles.userActionButtonTextStandard : styles.userActionButtonTextPremium
                ]}>
                  {user.type === 'premium' ? 'Std' : 'Prm'}
                </Text>
              </TouchableOpacity>
              {!isCurrentUser && !user.isSuperAdmin && (
                <>
                  {isSuperAdmin && (
                    <TouchableOpacity
                      style={[styles.userActionButton, styles.userActionButtonDelete]}
                      onPress={() => handleDeleteAllUserOrders(user.id, user.name)}
                    >
                      <Package size={14} color="#E31B23" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.userActionButton, styles.userActionButtonDelete]}
                    onPress={() => handleDeleteUser(user.id, user.name)}
                  >
                    <Trash2 size={14} color="#E31B23" />
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const handleSaveSettings = async () => {
    const commission = parseFloat(commissionPercentage);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast.showError('La commission doit être entre 0 et 100');
      return;
    }
    
    const result = await updateSettings({
      isGlobalPremiumEnabled: premiumEnabled,
      scrollingMessage: scrollingMessage.trim(),
      commissionPercentage: commission,
    });
    
    if (result.success) {
      toast.showSuccess('Paramètres globaux mis à jour');
    } else {
      toast.showError(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  const renderSettingsTab = () => {
    if (!isSuperAdmin) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.accessDeniedContainer}>
            <ShieldAlert size={64} color="#E31B23" />
            <Text style={styles.accessDeniedTitle}>Accès Refusé</Text>
            <Text style={styles.accessDeniedText}>
              Seul le super administrateur peut modifier les paramètres globaux de l&apos;application.
            </Text>
          </View>
        </View>
      );
    }

    return (
    <View style={styles.tabContent}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>⚡ Paramètres Globaux</Text>
          <Text style={styles.settingsSubtitle}>Gérez les paramètres de l&apos;application</Text>

          <View style={styles.settingSection}>
            <View style={styles.settingHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={styles.settingLabel}>Mode Premium Global</Text>
            </View>
            <Text style={styles.settingDescription}>
              Activez cette option pour activer le mode Premium pour tous les utilisateurs.
            </Text>
            <View style={styles.settingSwitchContainer}>
              <Text style={styles.settingSwitchLabel}>
                {premiumEnabled ? 'Activé' : 'Désactivé'}
              </Text>
              <TouchableOpacity
                style={[styles.switchButton, premiumEnabled && styles.switchButtonActive]}
                onPress={() => setPremiumEnabled(!premiumEnabled)}
              >
                <View style={[styles.switchThumb, premiumEnabled && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingSectionDivider} />

          <View style={styles.settingSection}>
            <View style={styles.settingHeader}>
              <Package size={20} color="#007AFF" />
              <Text style={styles.settingLabel}>Message défilant</Text>
            </View>
            <Text style={styles.settingDescription}>
              Ce message s&apos;affichera en haut de l&apos;application pour tous les utilisateurs.
            </Text>
            <TextInput
              style={styles.settingTextInput}
              placeholder="Entrez le message..."
              placeholderTextColor="#999"
              value={scrollingMessage}
              onChangeText={setScrollingMessage}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
            <Text style={styles.settingCharCount}>
              {scrollingMessage.length} / 200 caractères
            </Text>
          </View>

          <View style={styles.settingSectionDivider} />

          <View style={styles.settingSection}>
            <View style={styles.settingHeader}>
              <AlertCircle size={20} color="#E31B23" />
              <Text style={styles.settingLabel}>Commission (%)</Text>
            </View>
            <Text style={styles.settingDescription}>
              Pourcentage de commission appliqué sur chaque vente. Ce taux sera utilisé pour les calculs de prix.
            </Text>
            <TextInput
              style={styles.settingNumberInput}
              placeholder="10.0"
              placeholderTextColor="#999"
              value={commissionPercentage}
              onChangeText={setCommissionPercentage}
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.settingHint}>
              💡 Entrez une valeur entre 0 et 100
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
            onPress={handleSaveSettings}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Text style={styles.saveButtonText}>Enregistrement...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <ShieldCheck size={24} color="#00A651" />
          <Text style={styles.infoTitle}>Information</Text>
          <Text style={styles.infoText}>
            Ces paramètres sont globaux et affecteront tous les utilisateurs de l&apos;application.
            Assurez-vous de vérifier les valeurs avant de sauvegarder.
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dernière modification :</Text>
            <Text style={styles.infoValue}>
              {new Date(settings.updatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
    );
  };

  const renderUsersTab = () => {
    const premiumUsers = allUsers.filter(u => u.type === 'premium').length;
    const pendingPremium = allUsers.filter(u => u.premiumPaymentPending).length;

    return (
      <View style={styles.tabContent}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={20} color="#007AFF" />
            <Text style={styles.statValue}>{allUsers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Crown size={20} color="#FFD700" />
            <Text style={styles.statValue}>{premiumUsers}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color="#FFA500" />
            <Text style={styles.statValue}>{pendingPremium}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
        >
          {allUsers.length > 0 ? (
            allUsers.map(renderUserCard)
          ) : (
            <View style={styles.emptyState}>
              <Users size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>Aucun utilisateur</Text>
              <Text style={styles.emptyStateSubtext}>
                Les utilisateurs apparaîtront ici
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Admin', headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'products' && styles.tabActive]}
            onPress={() => setSelectedTab('products')}
          >
            <Package size={20} color={selectedTab === 'products' ? '#00A651' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'products' && styles.tabTextActive]}>
              Produits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'orders' && styles.tabActive]}
            onPress={() => setSelectedTab('orders')}
          >
            <Truck size={20} color={selectedTab === 'orders' ? '#00A651' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'orders' && styles.tabTextActive]}>
              Commandes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
            onPress={() => setSelectedTab('users')}
          >
            <Users size={20} color={selectedTab === 'users' ? '#00A651' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
              Utilisateurs
            </Text>
          </TouchableOpacity>
          {isSuperAdmin && (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'settings' && styles.tabActive]}
              onPress={() => setSelectedTab('settings')}
            >
              <SettingsIcon size={20} color={selectedTab === 'settings' ? '#00A651' : '#666'} />
              <Text style={[styles.tabText, selectedTab === 'settings' && styles.tabTextActive]}>
                Réglages
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {selectedTab === 'orders' && renderOrdersTab()}
      {selectedTab === 'products' && renderProductsTab()}
      {selectedTab === 'users' && renderUsersTab()}
      {selectedTab === 'settings' && renderSettingsTab()}

      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, type: null, targetId: null })}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejeter {rejectModal.type === 'product' ? "l'annonce" : "la commande"}</Text>
              <TouchableOpacity onPress={() => setRejectModal({ visible: false, type: null, targetId: null })}>
                <XCircle size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Veuillez indiquer la raison du rejet pour &quot;{rejectModal.targetTitle}&quot; :
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Raison du rejet..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setRejectModal({ visible: false, type: null, targetId: null })}
              >
                <Text style={styles.cancelModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmReject}
              >
                <Text style={styles.confirmModalButtonText}>Confirmer le rejet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
              { value: 'pending', label: 'À valider', count: getFilterCount('pending') },
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
                  setSelectedFilter(option.value as OrderStatus | 'all' | 'pending');
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
    backgroundColor: '#fff',
    paddingHorizontal: getContainerPadding(),
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#00A651',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: getContainerPadding(),
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  filterSelectorContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: getContainerPadding(),
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
    color: '#00A651',
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
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#00A651',
  },
  filterModalOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterModalOptionTextActive: {
    color: '#00A651',
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
    color: '#00A651',
    backgroundColor: '#C8E6C9',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: getContainerPadding(),
    paddingBottom: 100,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1600,
  },
  tabContent: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isWeb ? 20 : 16,
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
    marginBottom: 12,
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
  customerInfo: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
    gap: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  transactionId: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  itemsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
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
    color: '#00A651',
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
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#00A651',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: isWeb ? 14 : 12,
    borderRadius: 10,
    minHeight: getButtonHeight(),
  },
  validateButton: {
    backgroundColor: '#00A651',
  },
  rejectButton: {
    backgroundColor: '#E31B23',
  },
  shipButton: {
    backgroundColor: '#8E44AD',
    marginTop: 16,
  },
  completeButton: {
    backgroundColor: '#27AE60',
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E31B23',
  },
  rejectionReasonLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E31B23',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#666',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getDimensions().width < 600 ? 12 : (getDimensions().width < 1200 ? 16 : 20),
    justifyContent: 'flex-start',
  },
  productCard: {
    width: getProductCardWidth(),
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: getProductCardWidth() * 1.1,
    maxHeight: 330,
    backgroundColor: '#f5f5f5',
  },
  productStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  productCardInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#00A651',
    marginBottom: 4,
  },
  productSeller: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  productActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  productActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveProductButton: {
    backgroundColor: '#00A651',
  },
  rejectProductButton: {
    backgroundColor: '#E31B23',
  },
  productActionButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  productRejectionReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
  },
  productRejectionReasonText: {
    flex: 1,
    fontSize: 11,
    color: '#E31B23',
  },
  productAdminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  productAdminActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  productAdminActionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#007AFF',
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
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#E31B23',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#00A651',
    paddingVertical: isWeb ? 16 : 14,
    paddingHorizontal: isWeb ? 40 : 32,
    borderRadius: 12,
    minHeight: getButtonHeight(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
  },
  userCardInfo: {
    flex: 1,
    gap: 4,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
    flex: 1,
  },
  userPremiumBadge: {
    backgroundColor: '#FFF9E6',
    padding: 4,
    borderRadius: 8,
  },
  userAdminBadge: {
    backgroundColor: '#E8F4FF',
    padding: 4,
    borderRadius: 8,
  },
  userSuperAdminBadge: {
    backgroundColor: '#FFE8E8',
    padding: 4,
    borderRadius: 8,
  },
  userCardPhone: {
    fontSize: 13,
    color: '#666',
  },
  userCardLocation: {
    fontSize: 12,
    color: '#999',
  },
  userCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  userCardStatsText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600' as const,
  },
  userCardActions: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 90,
  },
  userActionButtonPremium: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  userActionButtonStandard: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userActionButtonDelete: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#E31B23',
    minWidth: 40,
  },
  userActionButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  userActionButtonTextPremium: {
    color: '#B8860B',
  },
  userActionButtonTextStandard: {
    color: '#666',
  },
  userPendingBadge: {
    backgroundColor: '#FFF9F0',
    padding: 4,
    borderRadius: 8,
  },
  premiumRequestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    padding: 8,
    backgroundColor: '#FFF9F0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  premiumRequestText: {
    fontSize: 11,
    color: '#FFA500',
    fontWeight: '600' as const,
  },
  userActionButtonApprove: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#00A651',
  },
  userActionButtonTextApprove: {
    color: '#00A651',
  },
  userActionButtonReject: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#E31B23',
    minWidth: 40,
  },
  userActionButtonMakeAdmin: {
    backgroundColor: '#E8F4FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  userActionButtonTextMakeAdmin: {
    color: '#007AFF',
  },
  userActionButtonRemoveAdmin: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#E31B23',
  },
  userActionButtonTextRemoveAdmin: {
    color: '#E31B23',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  productPriceDiscount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E31B23',
  },
  productPriceOriginal: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#999',
    textDecorationLine: 'line-through' as const,
  },
  discountBadge: {
    backgroundColor: '#E31B23',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#E31B23',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    height: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: isWeb ? 16 : 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: getButtonHeight(),
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelModalButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '600' as const,
    color: '#666',
  },
  confirmModalButton: {
    backgroundColor: '#E31B23',
  },
  confirmModalButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
  },
  deleteOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: isWeb ? 14 : 12,
    borderRadius: 10,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#E31B23',
  },
  deleteOrderButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '600' as const,
    color: '#E31B23',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isWeb ? 24 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  settingSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  settingSwitchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  switchButton: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    padding: 2,
  },
  switchButtonActive: {
    backgroundColor: '#00A651',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  settingTextInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  settingCharCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  settingNumberInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  settingHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  saveButton: {
    backgroundColor: '#00A651',
    borderRadius: 12,
    paddingVertical: isWeb ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: getButtonHeight(),
    shadowColor: '#00A651',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#00A651',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '700' as const,
  },
});
