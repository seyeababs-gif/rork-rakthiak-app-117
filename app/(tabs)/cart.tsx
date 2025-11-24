import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, Plus, Minus, CreditCard } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useOrders } from '@/contexts/OrderContext';
import { CartItem } from '@/types/marketplace';

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { isAuthenticated, currentUser } = useMarketplace();
  const { createOrder } = useOrders();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [transactionReference, setTransactionReference] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  });
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    if (!isAuthenticated || !currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour passer commande.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
    
    setDeliveryInfo({
      name: currentUser.name,
      phone: currentUser.deliveryPhone || currentUser.phone,
      address: currentUser.deliveryAddress || '',
      city: currentUser.deliveryCity || '',
    });
    setShowConfirmModal(true);
  };

  const handleCompleteOrder = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    
    try {
      const order = await createOrder(
        cartItems, 
        currentUser, 
        transactionReference.trim() || undefined, 
        deliveryInfo
      );
      
      if (order) {
        clearCart();
        setDeliveryInfo({ name: '', phone: '', address: '', city: '' });
        setTransactionReference('');
        setShowPaymentConfirmModal(false);
        setIsProcessing(false);
        
        setTimeout(() => {
          Alert.alert(
            '✅ Paiement confirmé !',
            'Votre paiement a été enregistré et est en attente de validation par l\'administrateur. Vous recevrez une notification une fois validée.\n\nVous pouvez suivre votre commande dans "Mes Commandes".',
            [
              { text: 'OK', onPress: () => router.push('/orders') }
            ]
          );
        }, 100);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la commande.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la commande.');
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!deliveryInfo.name.trim() || !deliveryInfo.phone.trim() || !deliveryInfo.address.trim() || !deliveryInfo.city.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setShowConfirmModal(false);
    setIsProcessing(true);

    try {
      const total = getCartTotal();
      const waveUrl = `https://pay.wave.com/m/M_sn_rplUWv_SWooz/c/sn/?amount=${total}`;
      
      const supported = await Linking.canOpenURL(waveUrl);
      if (supported) {
        await Linking.openURL(waveUrl);
        
        if (Platform.OS === 'web') {
          setShowPaymentConfirmModal(true);
          setIsProcessing(false);
        } else {
          Alert.alert(
            'Paiement Wave',
            'Après avoir effectué le paiement, revenez ici pour confirmer.',
            [
              {
                text: 'Annuler',
                style: 'cancel',
                onPress: () => {
                  setIsProcessing(false);
                  setShowConfirmModal(true);
                },
              },
              {
                text: 'J\'ai payé',
                onPress: () => {
                  Alert.prompt(
                    'Référence de transaction',
                    'Entrez votre numéro de référence Wave (optionnel)',
                    [
                      {
                        text: 'Annuler',
                        style: 'cancel',
                        onPress: () => setIsProcessing(false),
                      },
                      {
                        text: 'Confirmer',
                        onPress: async (transactionId: string | undefined) => {
                          if (!currentUser) return;
                          try {
                            const order = await createOrder(
                              cartItems, 
                              currentUser, 
                              transactionId || undefined, 
                              deliveryInfo
                            );
                            
                            if (order) {
                              clearCart();
                              setDeliveryInfo({ name: '', phone: '', address: '', city: '' });
                              setIsProcessing(false);
                              Alert.alert(
                                '✅ Paiement confirmé !',
                                'Votre paiement a été enregistré et est en attente de validation par l\'administrateur. Vous recevrez une notification une fois validée.\n\nVous pouvez suivre votre commande dans "Mes Commandes".'
                              );
                            } else {
                              Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la commande.');
                              setIsProcessing(false);
                            }
                          } catch (error) {
                            console.error('Error creating order:', error);
                            Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la commande.');
                            setIsProcessing(false);
                          }
                        },
                      },
                    ],
                    'plain-text'
                  );
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir Wave. Veuillez vérifier que l\'application est installée.'
        );
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error opening Wave:', err);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'ouverture de Wave. Veuillez réessayer.'
      );
      setIsProcessing(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const itemTotal = item.product.price * item.quantity;

    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.product.images[0] }} style={styles.productImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.product.title}
          </Text>
          <Text style={styles.productPrice}>{formatPrice(item.product.price)}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
            >
              <Minus size={16} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
            >
              <Plus size={16} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>Total: {formatPrice(itemTotal)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeFromCart(item.product.id)}
        >
          <Trash2 size={20} color="#E31B23" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Votre panier est vide</Text>
      <Text style={styles.emptySubtext}>
        Ajoutez des produits pour commencer vos achats
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mon Panier', headerShown: true }} />
      
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={[
          styles.listContent,
          cartItems.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyCart}
        showsVerticalScrollIndicator={false}
      />

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(getCartTotal())}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]} 
            onPress={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.checkoutButtonText}>Ouverture...</Text>
              </View>
            ) : (
              <View style={styles.processingContainer}>
                <CreditCard size={20} color="#fff" />
                <Text style={styles.checkoutButtonText}>Payer avec Wave</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Informations de livraison</Text>
              <Text style={styles.modalSubtitle}>
                Veuillez confirmer vos informations avant le paiement
              </Text>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom complet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom complet"
                    value={deliveryInfo.name}
                    onChangeText={(text) => setDeliveryInfo({ ...deliveryInfo, name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 77 123 45 67"
                    value={deliveryInfo.phone}
                    onChangeText={(text) => setDeliveryInfo({ ...deliveryInfo, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adresse de livraison</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Votre adresse complète"
                    value={deliveryInfo.address}
                    onChangeText={(text) => setDeliveryInfo({ ...deliveryInfo, address: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre ville"
                    value={deliveryInfo.city}
                    onChangeText={(text) => setDeliveryInfo({ ...deliveryInfo, city: text })}
                  />
                </View>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{cartItems.length} article(s)</Text>
                  <Text style={styles.summaryValue}>{formatPrice(getCartTotal())}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]} 
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalConfirmButton]} 
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirmer et payer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentConfirmModal(false);
          setShowConfirmModal(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Confirmation de paiement</Text>
              <Text style={styles.modalSubtitle}>
                Avez-vous effectué le paiement via Wave ?
              </Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>ℹ️ Important</Text>
                <Text style={styles.infoBoxText}>
                  Votre paiement sera en attente de validation par l&apos;administrateur. Vous recevrez une notification une fois validée.{' '}\n\nVous pourrez suivre votre commande dans &quot;Mes Commandes&quot;.
                </Text>
              </View>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Référence de transaction (optionnel)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrez votre numéro de référence Wave"
                    value={transactionReference}
                    onChangeText={setTransactionReference}
                  />
                </View>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Montant payé</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{formatPrice(getCartTotal())}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]} 
                  onPress={() => {
                    setShowPaymentConfirmModal(false);
                    setTransactionReference('');
                    setShowConfirmModal(true);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalConfirmButton]} 
                  onPress={handleCompleteOrder}
                >
                  <Text style={styles.modalConfirmButtonText}>J&apos;ai payé</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  checkoutButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#60A5FA',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#B3D9E6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  orderSummary: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  modalConfirmButton: {
    backgroundColor: '#1E3A8A',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1E3A8A',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});
