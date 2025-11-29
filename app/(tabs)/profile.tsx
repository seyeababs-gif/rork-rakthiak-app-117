import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,

  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, Package, Crown, LogOut, Calendar, Star, MoreVertical, Shield, Clock, CheckCircle, XCircle, ExternalLink, Camera, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { Product } from '@/types/marketplace';
import { useToast } from '@/contexts/ToastContext';
import * as ImagePicker from 'expo-image-picker';

import { 
  getDimensions,
  getProductCardWidth,
  isWeb,
  getContainerPadding,
  getButtonHeight,
  getButtonFontSize,
} from '@/constants/responsive';
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, userProducts, logout, getSellerRating, deleteProduct, updateUser, requestPremiumUpgrade } = useMarketplace();
  const toast = useToast();
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loginPromptContainer}>
          <View style={styles.loginIconContainer}>
            <User size={48} color="#1E3A8A" />
          </View>
          <Text style={styles.loginTitle}>Connexion requise</Text>
          <Text style={styles.loginSubtitle}>
            Connectez-vous pour accéder à votre profil, gérer vos annonces et suivre vos commandes.
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

  const handleChangeProfilePicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        toast.showError('Permission d\'accès à la galerie est requise');
        return;
      }

      toast.showAlert(
        'Changer la photo de profil',
        'Choisissez une option',
        [
          {
            text: 'Prendre une photo',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted === false) {
                toast.showError('Permission d\'accès à la caméra est requise');
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });

              if (!result.canceled && result.assets[0]) {
                await uploadProfilePicture(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Choisir de la galerie',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              });

              if (!result.canceled && result.assets[0]) {
                await uploadProfilePicture(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error changing profile picture:', error);
      toast.showError('Erreur lors du changement de photo');
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      
      const base64 = await fetch(uri)
        .then(res => res.blob())
        .then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      const result = await updateUser({ avatar: base64 });
      
      if (result && result.success) {
        toast.showSuccess('Photo de profil mise à jour');
      } else {
        toast.showError(result?.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.showError('Erreur lors du téléchargement de l\'image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpgrade = async () => {
    const waveUrl = 'https://pay.wave.com/m/M_sn_rplUWv_SWooz/c/sn/?amount=3500';
    
    toast.showAlert(
      'Passer à Premium',
      'Avantages Premium:\n\n• Produits illimités\n• Photos illimitées par produit\n• Gestion du stock\n• Promotions et réductions\n• Support prioritaire\n\nPrix: 3500 FCFA/mois\n\nVoulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer 3500 FCFA',
          onPress: async () => {
            try {
              await Linking.openURL(waveUrl);
              
              setTimeout(() => {
                toast.showAlert(
                  'Confirmation de paiement',
                  'Avez-vous effectué le paiement Wave de 3500 FCFA ?',
                  [
                    { 
                      text: 'Non', 
                      style: 'cancel',
                      onPress: () => {
                        toast.showInfo('Vous pouvez relancer le paiement plus tard.');
                      }
                    },
                    {
                      text: 'Oui',
                      onPress: async () => {
                        const result = await requestPremiumUpgrade();
                        if (result.success) {
                          toast.showAlert(
                            'Demande envoyée',
                            'Votre demande de passage en Premium est en attente de validation par un administrateur. Votre compte Premium sera activé dans les minutes qui suivent.',
                            [{ text: 'OK' }]
                          );
                        } else {
                          toast.showError(result.error || 'Une erreur est survenue');
                        }
                      },
                    },
                  ]
                );
              }, 2000);
            } catch (error) {
              console.error('Error opening Wave URL:', error);
              toast.showError('Impossible d\'ouvrir le lien de paiement Wave');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    toast.showAlert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const toggleAdminMode = () => {
    const newAdminStatus = !currentUser.isAdmin;
    toast.showAlert(
      newAdminStatus ? 'Activer le mode Admin' : 'Désactiver le mode Admin',
      newAdminStatus 
        ? 'Vous aurez accès au panneau d\'administration pour gérer les commandes.'
        : 'Vous n\'aurez plus accès au panneau d\'administration.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: newAdminStatus ? 'Activer' : 'Désactiver',
          onPress: async () => {
            const result = await updateUser({ isAdmin: newAdminStatus });
            if (result && result.success) {
              toast.showSuccess(`Mode Admin ${newAdminStatus ? 'activé' : 'désactivé'}`);
            } else {
              toast.showError(result?.error || 'Erreur lors de la mise à jour du mode admin');
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/product/edit/${productId}` as any);
  };

  const handleDeleteProduct = (productId: string, productTitle: string) => {
    toast.showAlert(
      'Supprimer l\'annonce',
      `Êtes-vous sûr de vouloir supprimer "${productTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteProduct(productId);
            toast.showSuccess('L\'annonce a été supprimée');
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handleShareShop = async () => {
    try {
      const shopUrl = `https://rakthiak.com/shop/${currentUser.id}`;
      const message = `🏪 Ma Boutique sur Marketplace\n\n` +
        `👤 ${currentUser.name}\n` +
        `📍 ${currentUser.location}\n` +
        `📦 ${userProducts.length} produit${userProducts.length > 1 ? 's' : ''} disponible${userProducts.length > 1 ? 's' : ''}\n\n` +
        `Découvrez tous mes produits ici:\n${shopUrl}`;

      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing shop:', error);
      toast.showError('Impossible de partager la boutique.');
    }
  };

  const handleShareProduct = async (product: Product) => {
    try {
      const productUrl = `https://rakthiak.com/product/${product.id}`;
      const message = `🛍️ ${product.title}\n\n` +
        `💰 Prix: ${formatPrice(product.price)}\n` +
        `📍 Localisation: ${product.location}\n\n` +
        `${product.description}\n\n` +
        `👉 Voir ce produit: ${productUrl}`;

      const result = await Share.share({
        message,
      });

      if (result.action === Share.sharedAction) {
        console.log('Product shared successfully');
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      toast.showError('Impossible de partager ce produit.');
    }
  };

  const handleProductOptions = (product: Product) => {
    toast.showAlert(
      product.title,
      'Que voulez-vous faire ?',
      [
        {
          text: 'Partager',
          onPress: () => handleShareProduct(product),
        },
        {
          text: 'Modifier',
          onPress: () => handleEditProduct(product.id),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleDeleteProduct(product.id, product.title),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const getProductStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'En attente', color: '#FFA500', icon: Clock };
      case 'approved':
        return { label: 'Approuvé', color: '#3B82F6', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejeté', color: '#E31B23', icon: XCircle };
      default:
        return { label: 'Approuvé', color: '#3B82F6', icon: CheckCircle };
    }
  };

  const renderProductCard = (product: Product) => {
    const statusInfo = getProductStatusInfo(product.status);
    const StatusIcon = statusInfo.icon;

    return (
      <View key={product.id} style={styles.productCard}>
        <TouchableOpacity
          onPress={() => router.push(`/product/${product.id}` as any)}
          activeOpacity={0.7}
          style={styles.productCardContent}
        >
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
          <View style={[styles.productStatusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <StatusIcon size={12} color={statusInfo.color} />
            <Text style={[styles.productStatusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.status === 'rejected' && product.rejectionReason && (
              <Text style={styles.productRejectionReason} numberOfLines={2}>
                ❌ {product.rejectionReason}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.productOptionsButton}
          onPress={() => handleProductOptions(product)}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const sellerRating = getSellerRating(currentUser.id);
  const memberSince = currentUser.joinedDate
    ? new Date(currentUser.joinedDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Récemment';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            <TouchableOpacity 
              style={styles.changePictureButton} 
              onPress={handleChangeProfilePicture}
              activeOpacity={0.7}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              {currentUser.type === 'premium' && (
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
            <View style={styles.infoRow}>
              <MapPin size={14} color="#666" />
              <Text style={styles.infoText}>{currentUser.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Phone size={14} color="#666" />
              <Text style={styles.infoText}>{currentUser.phone}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.shareShopButton} onPress={handleShareShop}>
          <ExternalLink size={16} color="#1E3A8A" />
          <Text style={styles.shareShopButtonText}>Partager ma boutique</Text>
        </TouchableOpacity>
        <View style={styles.buttonRow}>
          {currentUser.type === 'standard' && !currentUser.premiumPaymentPending && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Crown size={16} color="#FFD700" />
              <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
            </TouchableOpacity>
          )}
          {currentUser.premiumPaymentPending && (
            <View style={styles.pendingBadge}>
              <Clock size={16} color="#FFA500" />
              <Text style={styles.pendingBadgeText}>En attente de validation</Text>
            </View>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={16} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        {currentUser.isSuperAdmin && (
          <TouchableOpacity 
            style={currentUser.isAdmin ? styles.adminButtonActive : styles.adminButton} 
            onPress={toggleAdminMode}
          >
            <Shield size={16} color={currentUser.isAdmin ? "#fff" : "#1E3A8A"} />
            <Text style={currentUser.isAdmin ? styles.adminButtonTextActive : styles.adminButtonText}>
              {currentUser.isAdmin ? 'Mode Admin Activé' : 'Activer Mode Admin'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Package size={24} color="#1E3A8A" />
            <Text style={styles.statValue}>{userProducts.length}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color="#FFD700" />
            <Text style={styles.statValue}>
              {sellerRating.average > 0 ? sellerRating.average.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{memberSince.split(' ')[0]}</Text>
            <Text style={styles.statLabel}>Membre depuis</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#000" />
            <Text style={styles.sectionTitle}>Mes annonces</Text>
            <Text style={styles.sectionCount}>
              ({userProducts.length}{currentUser.type === 'standard' ? '/5' : ''})
            </Text>
          </View>

          {userProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {userProducts.map(renderProductCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateText}>Aucune annonce</Text>
              <Text style={styles.emptyStateSubtext}>
                Commencez à vendre vos produits
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: getContainerPadding(),
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E3A8A',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    minHeight: getButtonHeight(),
  },
  upgradeButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#B8860B',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    minHeight: getButtonHeight(),
  },
  logoutButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#FF3B30',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  sectionCount: {
    fontSize: 16,
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
  productCardContent: {
    width: '100%',
  },
  productOptionsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  productImage: {
    width: '100%',
    height: getProductCardWidth() * 1.1,
    maxHeight: 330,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
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
    color: '#1E3A8A',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginTop: 12,
    minHeight: getButtonHeight(),
  },
  adminButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    marginTop: 12,
    minHeight: getButtonHeight(),
  },
  adminButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  adminButtonTextActive: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
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
    zIndex: 1,
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  productRejectionReason: {
    fontSize: 11,
    color: '#E31B23',
    marginTop: 4,
  },
  pendingBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF9F0',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA500',
    minHeight: getButtonHeight(),
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFA500',
  },
  shareShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: isWeb ? 14 : 12,
    paddingHorizontal: isWeb ? 20 : 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    marginBottom: 12,
    minHeight: getButtonHeight(),
  },
  shareShopButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginPromptContainer: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    gap: 16,
  },
  loginIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: isWeb ? 18 : 16,
    paddingHorizontal: isWeb ? 40 : 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: getButtonHeight(),
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: getButtonFontSize(),
    fontWeight: '700' as const,
    color: '#fff',
  },
});