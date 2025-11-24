import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MapPin, Heart, ShoppingCart, Star, Share2, MessageCircle, Edit, Store } from 'lucide-react-native';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useCart } from '@/contexts/CartContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { products, toggleFavorite, isFavorite, getProductReviews, getProductRating, getSellerRating, isAuthenticated, currentUser } = useMarketplace();
  const { addToCart, isInCart, getCartItemsCount } = useCart();
  const router = useRouter();
  
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [wavePhoneNumber, setWavePhoneNumber] = useState('');
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [paymentWaveNumber, setPaymentWaveNumber] = useState('');

  const product = products.find(p => p.id === id);
  
  const productReviews = product ? getProductReviews(product.id) : [];
  const productRating = product ? getProductRating(product.id) : { average: 0, count: 0 };
  const sellerRating = product ? getSellerRating(product.sellerId) : { average: 0, count: 0 };
  
  const displayedReviews = showAllReviews ? productReviews : productReviews.slice(0, 2);

  const isAdmin = currentUser?.isAdmin === true;
  const isSuperAdmin = currentUser?.isSuperAdmin === true;
  const canViewAndEdit = isAdmin || isSuperAdmin;

  if (!product) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Produit introuvable', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Produit non trouvé</Text>
        </View>
      </View>
    );
  }

  const favorite = isFavorite(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const getPriceDisplay = () => {
    if (product.listingType === 'service' && product.serviceDetails) {
      if (product.serviceDetails.pricePerKg) {
        return `${formatPrice(product.serviceDetails.pricePerKg)}/kg`;
      }
      if (product.serviceDetails.tripPrice) {
        return `${formatPrice(product.serviceDetails.tripPrice)} (trajet)`;
      }
    }
    return formatPrice(product.price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleContactWhatsApp = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour contacter le vendeur.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    const message = encodeURIComponent(
      `Bonjour, je suis intéressé par votre produit:\n\n` +
      `${product.title}\n` +
      `Prix: ${formatPrice(product.price)}\n` +
      `Localisation: ${product.location}\n\n` +
      `Pouvez-vous me donner plus d'informations ?`
    );
    
    const whatsappUrl = `https://wa.me/${product.sellerPhone.replace(/[^0-9]/g, '')}?text=${message}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        }
      })
      .catch((err) => console.error('Error opening WhatsApp:', err));
  };

  const handleContactWave = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour contacter le vendeur.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
    setShowContactModal(true);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour acheter.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    if (product.isOutOfStock) {
      Alert.alert('Rupture de stock', 'Ce produit n\'est plus disponible.');
      return;
    }

    if (currentUser) {
      setDeliveryName(currentUser.name);
      setDeliveryPhone(currentUser.deliveryPhone || currentUser.phone);
      setDeliveryAddress(currentUser.deliveryAddress || '');
      setDeliveryCity(currentUser.deliveryCity || '');
    }
    setShowBuyNowModal(true);
  };

  const handleConfirmBuyNow = () => {
    if (!deliveryName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim() || !deliveryCity.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir toutes les informations de livraison');
      return;
    }

    if (!paymentWaveNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro Wave');
      return;
    }

    setShowBuyNowModal(false);
    const waveUrl = `https://pay.wave.com/m/M_sn_rplUWv_SWooz/c/sn/?amount=${product.price}`;
    
    Linking.canOpenURL(waveUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waveUrl);
          Alert.alert(
            'Paiement Wave',
            'Après le paiement, veuillez confirmer votre paiement pour que votre commande soit validée par un administrateur.',
            [
              { text: 'OK' },
            ]
          );
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir Wave');
        }
      })
      .catch((err) => {
        console.error('Error opening Wave:', err);
        Alert.alert('Erreur', 'Une erreur est survenue');
      });
  };

  const handleWavePayment = () => {
    if (!wavePhoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro Wave');
      return;
    }

    setShowContactModal(false);
    const waveUrl = `https://pay.wave.com/m/M_sn_rplUWv_SWooz/c/sn/?amount=${product.price}`;
    
    Linking.canOpenURL(waveUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waveUrl);
          Alert.alert(
            'Paiement Wave',
            'Après le paiement, vous pouvez contacter le vendeur sur WhatsApp.',
            [
              { text: 'OK', onPress: () => setWavePhoneNumber('') },
            ]
          );
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir Wave');
        }
      })
      .catch((err) => {
        console.error('Error opening Wave:', err);
        Alert.alert('Erreur', 'Une erreur est survenue');
      });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter au panier.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    if (product.isOutOfStock) {
      Alert.alert('Rupture de stock', 'Ce produit n\'est plus disponible.');
      return;
    }

    addToCart(product, 1);
  };

  const handleShare = async () => {
    try {
      const productUrl = `https://rakthiak.com/product/${product.id}`;
      const message = `🛍️ ${product.title}\n\n` +
        `💰 Prix: ${formatPrice(product.price)}\n` +
        `📍 Localisation: ${product.location}\n\n` +
        `${product.description}\n\n` +
        `👉 ${productUrl}`;

      const result = await Share.share({
        message,
      });

      if (result.action === Share.sharedAction) {
        console.log('Product shared successfully');
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      Alert.alert('Erreur', 'Impossible de partager ce produit.');
    }
  };

  const handleCopyLink = async () => {
    try {
      const productUrl = `https://rakthiak.com/product/${product.id}`;
      await Clipboard.setStringAsync(productUrl);
      Alert.alert('Lien copié', 'Le lien du produit a été copié dans le presse-papiers.');
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Erreur', 'Impossible de copier le lien.');
    }
  };

  const getStatusDisplay = () => {
    switch (product.status) {
      case 'pending':
        return { label: 'En attente de validation', color: '#FFA500', bgColor: '#FFF9F0' };
      case 'approved':
        return { label: 'Approuvé', color: '#00A651', bgColor: '#E8F5E9' };
      case 'rejected':
        return { label: 'Rejeté', color: '#E31B23', bgColor: '#FFF5F5' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: canViewAndEdit && product.status !== 'approved' ? `${product.title} (${statusDisplay.label})` : product.title,
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerCartButton}
                onPress={() => router.push('/cart')}
              >
                <ShoppingCart size={22} color="#007AFF" />
                {getCartItemsCount() > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {canViewAndEdit && (
                <TouchableOpacity
                  style={styles.headerEditButton}
                  onPress={() => router.push(`/product/edit/${product.id}` as any)}
                >
                  <Edit size={22} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }} 
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imagesCarousel}
        >
          {product.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.productImage} />
          ))}
        </ScrollView>

        <View style={styles.infoContainer}>
          {canViewAndEdit && product.status !== 'approved' && (
            <View style={[styles.adminStatusBanner, { backgroundColor: statusDisplay.bgColor, borderLeftColor: statusDisplay.color }]}>
              <Text style={[styles.adminStatusText, { color: statusDisplay.color }]}>
                📋 Statut : {statusDisplay.label}
              </Text>
              {product.status === 'rejected' && product.rejectionReason && (
                <Text style={styles.adminStatusSubtext}>
                  Raison : {product.rejectionReason}
                </Text>
              )}
            </View>
          )}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productPrice}>{getPriceDisplay()}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCopyLink}
                onLongPress={handleShare}
              >
                <Share2
                  size={22}
                  color="#1E3A8A"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => toggleFavorite(product.id)}
              >
                <Heart
                  size={22}
                  color={favorite ? '#E31B23' : '#666'}
                  fill={favorite ? '#E31B23' : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#666" />
              <Text style={styles.metaText}>{product.location}</Text>
            </View>
            {product.condition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>
                  {product.condition === 'new' ? 'Neuf' : product.condition === 'used' ? 'Occasion' : 'Reconditionné'}
                </Text>
              </View>
            )}
          </View>

          {product.listingType === 'product' && (
            <View style={styles.stockInfo}>
              {product.isOutOfStock ? (
                <View style={styles.stockBadgeOutOfStock}>
                  <Text style={styles.stockTextOutOfStock}>Rupture de stock</Text>
                </View>
              ) : product.stockQuantity !== undefined && product.stockQuantity > 0 ? (
                <View style={styles.stockBadgeInStock}>
                  <Text style={styles.stockTextInStock}>
                    {product.stockQuantity} {product.stockQuantity === 1 ? 'unité disponible' : 'unités disponibles'}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {product.listingType === 'service' && product.serviceDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Détails du service</Text>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceLabel}>Départ:</Text>
                  <Text style={styles.serviceValue}>{product.serviceDetails.departureLocation}</Text>
                </View>
                <View style={styles.serviceRow}>
                  <Text style={styles.serviceLabel}>Arrivée:</Text>
                  <Text style={styles.serviceValue}>{product.serviceDetails.arrivalLocation}</Text>
                </View>
                {product.serviceDetails.departureDate && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Date de départ:</Text>
                    <Text style={styles.serviceValue}>
                      {new Date(product.serviceDetails.departureDate).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
                {product.serviceDetails.vehicleType && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Véhicule:</Text>
                    <Text style={styles.serviceValue}>{product.serviceDetails.vehicleType}</Text>
                  </View>
                )}
                {product.serviceDetails.availableSeats && (
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceLabel}>Places disponibles:</Text>
                    <Text style={styles.serviceValue}>{product.serviceDetails.availableSeats}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <TouchableOpacity
              style={styles.sellerCard}
              onPress={() => router.push(`/shop/${product.sellerId}` as any)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: product.sellerAvatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{product.sellerName}</Text>
                  <Store size={16} color="#1E3A8A" />
                </View>
                {sellerRating.count > 0 && (
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>
                      {sellerRating.average.toFixed(1)} ({sellerRating.count} avis)
                    </Text>
                  </View>
                )}
                <View style={styles.sellerMeta}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.sellerMetaText}>{product.location}</Text>
                </View>
                <Text style={styles.sellerDate}>
                  Publié le {formatDate(product.createdAt)}
                </Text>
                <Text style={styles.viewShopText}>Voir la boutique ›</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {productReviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Avis</Text>
                {productRating.count > 0 && (
                  <View style={styles.ratingBadge}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingBadgeText}>
                      {productRating.average.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingCount}>({productRating.count})</Text>
                  </View>
                )}
              </View>
              
              {displayedReviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewHeaderInfo}>
                      <Text style={styles.reviewUserName}>{review.userName}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            color="#FFB800"
                            fill={star <= review.rating ? '#FFB800' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(review.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
              
              {productReviews.length > 2 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllReviews ? 'Voir moins' : `Voir tous les avis (${productReviews.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.buyNowButton,
            product.isOutOfStock && styles.buttonDisabled
          ]} 
          onPress={handleBuyNow}
          disabled={product.isOutOfStock}
        >
          <Text style={styles.buttonText}>
            {product.isOutOfStock ? 'Rupture de stock' : 'Acheter maintenant'}
          </Text>
        </TouchableOpacity>
        <View style={styles.footerMainButtons}>
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.addToCartButton,
              (isInCart(product.id) || product.isOutOfStock) && styles.buttonDisabled
            ]} 
            onPress={handleAddToCart}
            disabled={isInCart(product.id) || product.isOutOfStock}
          >
            <ShoppingCart size={22} color="#fff" />
            <Text style={styles.smallButtonText}>
              {product.isOutOfStock ? 'Rupture' : isInCart(product.id) ? 'Dans le panier' : 'Panier'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.whatsappIconButton} 
            onPress={handleContactWhatsApp}
          >
            <MessageCircle size={24} color="#25D366" fill="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Paiement avec Wave</Text>
            <Text style={styles.modalSubtitle}>
              Entrez votre numéro Wave pour le paiement
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro Wave</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 77 123 45 67"
                value={wavePhoneNumber}
                onChangeText={setWavePhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.productSummary}>
              <Text style={styles.summaryLabel}>Produit:</Text>
              <Text style={styles.summaryValue}>{product.title}</Text>
              <Text style={styles.summaryLabel}>Montant:</Text>
              <Text style={styles.summaryAmount}>{formatPrice(product.price)}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => {
                  setShowContactModal(false);
                  setWavePhoneNumber('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]} 
                onPress={handleWavePayment}
              >
                <Text style={styles.modalConfirmButtonText}>Payer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBuyNowModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBuyNowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acheter maintenant</Text>
            <Text style={styles.modalSubtitle}>
              Veuillez remplir vos informations de livraison
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                value={deliveryName}
                onChangeText={setDeliveryName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 77 123 45 67"
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse de livraison</Text>
              <TextInput
                style={styles.input}
                placeholder="Rue, quartier..."
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre ville"
                value={deliveryCity}
                onChangeText={setDeliveryCity}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro Wave pour le paiement</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 77 123 45 67"
                value={paymentWaveNumber}
                onChangeText={setPaymentWaveNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.productSummary}>
              <Text style={styles.summaryLabel}>Produit:</Text>
              <Text style={styles.summaryValue}>{product.title}</Text>
              <Text style={styles.summaryLabel}>Montant:</Text>
              <Text style={styles.summaryAmount}>{formatPrice(product.price)}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => {
                  setShowBuyNowModal(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]} 
                onPress={handleConfirmBuyNow}
              >
                <Text style={styles.modalConfirmButtonText}>Payer avec Wave</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 180,
  },
  imagesCarousel: {
    height: 300,
  },
  productImage: {
    width,
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  sellerCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewShopText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    marginTop: 4,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerMetaText: {
    fontSize: 13,
    color: '#666',
  },
  sellerDate: {
    fontSize: 12,
    color: '#999',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  ratingCount: {
    fontSize: 13,
    color: '#666',
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  reviewHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
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
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButton: {
    backgroundColor: '#1E3A8A',
  },
  whatsappIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  footerMainButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waveLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  waveLinkText: {
    fontSize: 14,
    color: '#1E3A8A',
    textDecorationLine: 'underline',
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
    gap: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
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
  productSummary: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
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
  serviceDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    flex: 1,
  },
  serviceValue: {
    fontSize: 14,
    color: '#000',
    flex: 2,
    textAlign: 'right',
  },
  stockInfo: {
    marginTop: 12,
    marginBottom: 12,
  },
  stockBadgeInStock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D4EDDA',
    borderWidth: 1,
    borderColor: '#28A745',
    alignSelf: 'flex-start',
  },
  stockTextInStock: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#155724',
  },
  stockBadgeOutOfStock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8D7DA',
    borderWidth: 1,
    borderColor: '#DC3545',
    alignSelf: 'flex-start',
  },
  stockTextOutOfStock: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#721C24',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginRight: 8,
  },
  headerCartButton: {
    padding: 8,
    position: 'relative' as const,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    backgroundColor: '#E31B23',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerEditButton: {
    padding: 8,
  },
  adminStatusBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  adminStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  adminStatusSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buyNowButton: {
    backgroundColor: '#00A651',
  },
  smallButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
