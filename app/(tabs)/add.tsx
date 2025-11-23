import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, Image as ImageIcon, Package, Briefcase, Calendar as CalendarIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useToast } from '@/contexts/ToastContext';
import { categories, getSubCategoriesForCategory } from '@/constants/categories';
import { Category, ListingType } from '@/types/marketplace';

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { addProduct, canAddProduct, getMaxImages, currentUser, isAuthenticated } = useMarketplace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [listingType, setListingType] = useState<ListingType>('product');

  React.useEffect(() => {
    if (listingType === 'service') {
      setCategory('delivery');
      setSubCategory(undefined);
    } else {
      setCategory('electronics');
      setSubCategory(undefined);
    }
  }, [listingType]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<Category>('electronics');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('used');
  const [images, setImages] = useState<string[]>([]);

  const [departureLocation, setDepartureLocation] = useState<string>('');
  const [arrivalLocation, setArrivalLocation] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [pricePerKg, setPricePerKg] = useState<string>('');
  const [tripPrice, setTripPrice] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [availableSeats, setAvailableSeats] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [manageStock, setManageStock] = useState<boolean>(false);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<string>('');

  const pickImage = async () => {
    const maxImages = getMaxImages();
    if (images.length >= maxImages) {
      toast.showAlert(
        'Limite atteinte',
        currentUser?.type === 'standard'
          ? 'Vous pouvez ajouter maximum 2 photos par produit. Passez à Premium pour un accès illimité.'
          : 'Limite de photos atteinte.'
      );
      return;
    }

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.showAlert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const maxImages = getMaxImages();
    if (images.length >= maxImages) {
      toast.showAlert(
        'Limite atteinte',
        currentUser?.type === 'standard'
          ? 'Vous pouvez ajouter maximum 2 photos par produit. Passez à Premium pour un accès illimité.'
          : 'Limite de photos atteinte.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      toast.showAlert('Non disponible', 'La caméra n&apos;est pas disponible sur le web.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.showAlert('Permission requise', 'Nous avez besoin de votre permission pour accéder à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.showAlert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter un produit.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }

    const productCheck = canAddProduct();
    if (!productCheck.canAdd) {
      toast.showAlert('Limite atteinte', productCheck.reason);
      return;
    }

    if (!title.trim()) {
      toast.showAlert('Erreur', 'Veuillez entrer un titre');
      return;
    }
    if (!description.trim()) {
      toast.showAlert('Erreur', 'Veuillez entrer une description');
      return;
    }

    if (listingType === 'product') {
      if (!price.trim() || isNaN(Number(price))) {
        toast.showAlert('Erreur', 'Veuillez entrer un prix valide');
        return;
      }
      if (!location.trim()) {
        toast.showAlert('Erreur', 'Veuillez entrer une localisation');
        return;
      }
      if (!category) {
        toast.showAlert('Erreur', 'Veuillez sélectionner une catégorie');
        return;
      }
      if (getSubCategoriesForCategory(category).length > 0 && !subCategory) {
        toast.showAlert('Erreur', 'Veuillez sélectionner une sous-catégorie');
        return;
      }
      if (!condition) {
        toast.showAlert('Erreur', 'Veuillez sélectionner l\'état du produit');
        return;
      }
    }

    if (listingType === 'service') {
      if (!departureLocation.trim()) {
        toast.showAlert('Erreur', 'Veuillez entrer le lieu de départ');
        return;
      }
      if (!arrivalLocation.trim()) {
        toast.showAlert('Erreur', 'Veuillez entrer le lieu d\'arrivée');
        return;
      }
      if (!departureDate) {
        toast.showAlert('Erreur', 'Veuillez sélectionner la date et l\'heure de départ');
        return;
      }
      if (!category) {
        toast.showAlert('Erreur', 'Veuillez sélectionner une catégorie');
        return;
      }
      if (!subCategory) {
        toast.showAlert('Erreur', 'Veuillez sélectionner un type de service');
        return;
      }
      
      if (subCategory === 'covoiturage' || subCategory === 'thiaktiak') {
        if (!tripPrice.trim() || isNaN(Number(tripPrice))) {
          toast.showAlert('Erreur', 'Veuillez entrer le prix du trajet');
          return;
        }
        if (subCategory === 'covoiturage') {
          if (!vehicleType.trim()) {
            toast.showAlert('Erreur', 'Veuillez entrer le type de véhicule');
            return;
          }
          if (!availableSeats.trim() || isNaN(Number(availableSeats))) {
            toast.showAlert('Erreur', 'Veuillez entrer le nombre de places disponibles');
            return;
          }
        }
      }
      
      if (subCategory === 'gp' || subCategory === 'conteneur') {
        if (!pricePerKg.trim() || isNaN(Number(pricePerKg))) {
          toast.showAlert('Erreur', 'Veuillez entrer le prix par kg');
          return;
        }
      }
      
      if (subCategory === 'autres') {
        if (!tripPrice.trim() || isNaN(Number(tripPrice))) {
          toast.showAlert('Erreur', 'Veuillez entrer le tarif');
          return;
        }
      }
    }

    if (images.length === 0) {
      toast.showAlert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    let servicePrice = 0;
    if (listingType === 'service') {
      if (pricePerKg) servicePrice = Number(pricePerKg);
      else if (tripPrice) servicePrice = Number(tripPrice);
    }

    setIsSubmitting(true);
    try {
      // @ts-ignore - addProduct returns a promise with status
      const result = await addProduct({
        title: title.trim(),
        description: description.trim(),
        price: listingType === 'product' ? Number(price) : servicePrice,
        location: listingType === 'product' ? location.trim() : departureLocation.trim(),
        category,
        subCategory: subCategory as any,
        condition: listingType === 'product' ? condition : undefined,
        images,
        sellerPhone: currentUser?.phone || '',
        listingType,
        stockQuantity: listingType === 'product' && manageStock && stockQuantity ? Number(stockQuantity) : undefined,
        isOutOfStock: listingType === 'product' ? false : undefined,
        hasDiscount: listingType === 'product' && hasDiscount,
        discountPercent: listingType === 'product' && hasDiscount && discountPercent ? Number(discountPercent) : undefined,
        originalPrice: listingType === 'product' && hasDiscount && discountPercent ? Number(price) : undefined,
        serviceDetails: listingType === 'service' ? {
          departureLocation: departureLocation.trim(),
          arrivalLocation: arrivalLocation.trim(),
          departureDate: departureDate ? departureDate.toISOString() : undefined,
          arrivalDate: undefined,
          pricePerKg: pricePerKg ? Number(pricePerKg) : undefined,
          tripPrice: tripPrice ? Number(tripPrice) : undefined,
          vehicleType: vehicleType.trim() || undefined,
          availableSeats: availableSeats ? Number(availableSeats) : undefined,
        } : undefined,
      });

      if (result && result.success) {
        toast.showSuccess('Votre annonce a été soumise et est en attente de validation par un administrateur !', 5000);
        
        setTitle('');
        setDescription('');
        setPrice('');
        setLocation('');
        setCategory('electronics');
        setSubCategory(undefined);
        setImages([]);
        setDepartureLocation('');
        setArrivalLocation('');
        setDepartureDate(undefined);
        setPricePerKg('');
        setTripPrice('');
        setVehicleType('');
        setAvailableSeats('');
        setStockQuantity('');
        setManageStock(false);
        setHasDiscount(false);
        setDiscountPercent('');
        
        router.push('/(tabs)/' as any);
      } else {
        toast.showError(result?.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      toast.showError('Une erreur inattendue est survenue');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.authRequired, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.authTitle}>Connexion requise</Text>
          <Text style={styles.authSubtitle}>
            Vous devez être connecté pour ajouter un produit
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authButtonSecondary}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.authButtonSecondaryText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Publier une annonce</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser?.type === 'standard'
            ? 'Compte Standard - 5 annonces max, 2 photos/annonce'
            : 'Compte Premium - Accès illimité'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type d&apos;annonce</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                listingType === 'product' && styles.typeButtonSelected,
              ]}
              onPress={() => setListingType('product')}
            >
              <Package size={24} color={listingType === 'product' ? '#fff' : '#1E3A8A'} />
              <Text
                style={[
                  styles.typeButtonText,
                  listingType === 'product' && styles.typeButtonTextSelected,
                ]}
              >
                Vendre un produit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                listingType === 'service' && styles.typeButtonSelected,
              ]}
              onPress={() => setListingType('service')}
            >
              <Briefcase size={24} color={listingType === 'service' ? '#fff' : '#1E3A8A'} />
              <Text
                style={[
                  styles.typeButtonText,
                  listingType === 'service' && styles.typeButtonTextSelected,
                ]}
              >
                Proposer un service
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.photoCount}>
              {images.length}/{currentUser?.type === 'premium' ? '∞' : '2'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <ImageIcon size={24} color="#1E3A8A" />
              <Text style={styles.addImageText}>Galerie</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                <Camera size={24} color="#1E3A8A" />
                <Text style={styles.addImageText}>Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de l'annonce"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description détaillée"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />

          {listingType === 'product' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Prix (FCFA)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Localisation (ex: Dakar, Plateau)"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#999"
              />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Lieu de départ (ex: Dakar)"
                value={departureLocation}
                onChangeText={setDepartureLocation}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Lieu d'arrivée (ex: Saint-Louis)"
                value={arrivalLocation}
                onChangeText={setArrivalLocation}
                placeholderTextColor="#999"
              />
              <View style={styles.dateInputWrapper}>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={() => {
                    setTempDate(departureDate || new Date());
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <CalendarIcon size={22} color="#1E3A8A" style={styles.calendarIcon} />
                  <View style={styles.dateDisplayContainer}>
                    {departureDate ? (
                      <>
                        <Text style={styles.dateDisplayText}>
                          {departureDate.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.timeDisplayText}>
                          {departureDate.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.dateInputPlaceholder}>Sélectionner la date et l&apos;heure</Text>
                    )}
                  </View>
                  <View style={styles.calendarButton}>
                    <CalendarIcon size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.dateHint}>Appuyez pour sélectionner la date et l&apos;heure de départ</Text>
              </View>
              
              {(subCategory === 'thiaktiak' || subCategory === 'covoiturage') && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Prix du trajet (FCFA)"
                    value={tripPrice}
                    onChangeText={setTripPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                  {subCategory === 'covoiturage' && (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Type de véhicule (ex: Toyota Corolla)"
                        value={vehicleType}
                        onChangeText={setVehicleType}
                        placeholderTextColor="#999"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Nombre de places disponibles (ex: 4)"
                        value={availableSeats}
                        onChangeText={setAvailableSeats}
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                    </>
                  )}
                </>
              )}

              {(subCategory === 'gp' || subCategory === 'conteneur') && (
                <TextInput
                  style={styles.input}
                  placeholder="Prix par kg (FCFA)"
                  value={pricePerKg}
                  onChangeText={setPricePerKg}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              )}

              {subCategory === 'autres' && (
                <TextInput
                  style={styles.input}
                  placeholder="Tarif (FCFA)"
                  value={tripPrice}
                  onChangeText={setTripPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie</Text>
          <View style={styles.categoriesGrid}>
            {categories.filter(c => c.id !== 'all').filter(c => listingType === 'product' ? c.id !== 'delivery' : c.id === 'delivery').map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonSelected,
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  setSubCategory(undefined);
                }}
              >
                <Text style={styles.categoryButtonIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat.id && styles.categoryButtonTextSelected,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {listingType === 'service' && category === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de service</Text>
            <View style={styles.categoriesGrid}>
              {getSubCategoriesForCategory('delivery').map((subCat) => (
                <TouchableOpacity
                  key={subCat.id}
                  style={[
                    styles.categoryButton,
                    subCategory === subCat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSubCategory(subCat.id)}
                >
                  <Text style={styles.categoryButtonIcon}>{subCat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      subCategory === subCat.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {subCat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {listingType === 'product' && getSubCategoriesForCategory(category).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sous-catégorie</Text>
            <View style={styles.categoriesGrid}>
              {getSubCategoriesForCategory(category).map((subCat) => (
                <TouchableOpacity
                  key={subCat.id}
                  style={[
                    styles.categoryButton,
                    subCategory === subCat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSubCategory(subCat.id)}
                >
                  <Text style={styles.categoryButtonIcon}>{subCat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      subCategory === subCat.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {subCat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {listingType === 'product' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>État</Text>
            <View style={styles.conditionRow}>
              {[
                { value: 'new' as const, label: 'Neuf' },
                { value: 'used' as const, label: 'Occasion' },
                { value: 'refurbished' as const, label: 'Reconditionné' },
              ].map((cond) => (
                <TouchableOpacity
                  key={cond.value}
                  style={[
                    styles.conditionButton,
                    condition === cond.value && styles.conditionButtonSelected,
                  ]}
                  onPress={() => setCondition(cond.value)}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      condition === cond.value && styles.conditionButtonTextSelected,
                    ]}
                  >
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {listingType === 'product' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Réduction / Promotion</Text>
              {currentUser?.type === 'standard' && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => {
                if (currentUser?.type === 'standard') {
                  toast.showAlert(
                    'Fonctionnalité Premium',
                    'Les promotions sont réservées aux utilisateurs Premium. Passez à Premium pour 3500 FCFA/mois pour accéder à cette fonctionnalité.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Passer à Premium', onPress: () => router.push('/(tabs)/profile' as any) },
                    ]
                  );
                } else {
                  setHasDiscount(!hasDiscount);
                }
              }}
            >
              <View style={[styles.checkbox, hasDiscount && styles.checkboxChecked, currentUser?.type === 'standard' && styles.checkboxDisabled]}>
                {hasDiscount && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, currentUser?.type === 'standard' && styles.checkboxLabelDisabled]}>Ce produit est en promotion</Text>
            </TouchableOpacity>
            {hasDiscount && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Pourcentage de réduction (ex: 20 pour 20%)"
                  value={discountPercent}
                  onChangeText={(text) => {
                    const num = Number(text);
                    if (text === '' || (!isNaN(num) && num > 0 && num <= 100)) {
                      setDiscountPercent(text);
                    }
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {discountPercent && price && (
                  <View style={styles.discountPreview}>
                    <Text style={styles.discountPreviewLabel}>Prix après réduction :</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.originalPrice}>{Number(price).toLocaleString('fr-FR')} FCFA</Text>
                      <Text style={styles.discountedPrice}>
                        {Math.round(Number(price) * (1 - Number(discountPercent) / 100)).toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {listingType === 'product' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gestion du stock</Text>
              {currentUser?.type === 'standard' && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => {
                if (currentUser?.type === 'standard') {
                  toast.showAlert(
                    'Fonctionnalité Premium',
                    'La gestion du stock est réservée aux utilisateurs Premium. Passez à Premium pour 3500 FCFA/mois pour accéder à cette fonctionnalité.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Passer à Premium', onPress: () => router.push('/(tabs)/profile' as any) },
                    ]
                  );
                } else {
                  setManageStock(!manageStock);
                }
              }}
            >
              <View style={[styles.checkbox, manageStock && styles.checkboxChecked, currentUser?.type === 'standard' && styles.checkboxDisabled]}>
                {manageStock && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, currentUser?.type === 'standard' && styles.checkboxLabelDisabled]}>Gérer le stock de ce produit</Text>
            </TouchableOpacity>
            {manageStock && (
              <TextInput
                style={styles.input}
                placeholder="Quantité disponible"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            )}
          </View>
        )}

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ AVERTISSEMENT IMPORTANT</Text>
          <Text style={styles.warningDescription}>
            Si vous ne livrez pas un produit commandé, si le produit est en rupture de stock, ou si vous livrez en retard, votre compte sera banni définitivement sans possibilité de récupération.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Publication en cours...' : "Publier l'annonce"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS !== 'web' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.nativeDateModalContent}>
              <Text style={styles.modalTitle}>Sélectionner la date et l&apos;heure</Text>
              <View style={styles.nativePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  textColor="#1E3A8A"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  style={styles.datePicker}
                />
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  textColor="#1E3A8A"
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setTempDate(selectedTime);
                    }
                  }}
                  style={styles.timePicker}
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setTempDate(departureDate || new Date());
                  }}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={() => {
                    setDepartureDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.modalConfirmText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'web' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sélectionner la date et l&apos;heure</Text>
              <View style={styles.webDatePickerContainer}>
                <View style={styles.webDatePickerRow}>
                  <View style={styles.webDatePickerField}>
                    <Text style={styles.webDatePickerLabel}>Jour</Text>
                    <TextInput
                      style={styles.webDatePickerInput}
                      placeholder="JJ"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempDate ? tempDate.getDate().toString().padStart(2, '0') : ''}
                      onChangeText={(text) => {
                        const day = parseInt(text);
                        if (!isNaN(day) && day >= 1 && day <= 31) {
                          const newDate = new Date(tempDate || new Date());
                          newDate.setDate(day);
                          setTempDate(newDate);
                        }
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.webDatePickerField}>
                    <Text style={styles.webDatePickerLabel}>Mois</Text>
                    <TextInput
                      style={styles.webDatePickerInput}
                      placeholder="MM"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempDate ? (tempDate.getMonth() + 1).toString().padStart(2, '0') : ''}
                      onChangeText={(text) => {
                        const month = parseInt(text);
                        if (!isNaN(month) && month >= 1 && month <= 12) {
                          const newDate = new Date(tempDate || new Date());
                          newDate.setMonth(month - 1);
                          setTempDate(newDate);
                        }
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.webDatePickerField}>
                    <Text style={styles.webDatePickerLabel}>Année</Text>
                    <TextInput
                      style={styles.webDatePickerInput}
                      placeholder="AAAA"
                      keyboardType="numeric"
                      maxLength={4}
                      value={tempDate ? tempDate.getFullYear().toString() : ''}
                      onChangeText={(text) => {
                        const year = parseInt(text);
                        if (!isNaN(year) && year >= 2024) {
                          const newDate = new Date(tempDate || new Date());
                          newDate.setFullYear(year);
                          setTempDate(newDate);
                        }
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.webDatePickerRow}>
                  <View style={styles.webDatePickerField}>
                    <Text style={styles.webDatePickerLabel}>Heure</Text>
                    <TextInput
                      style={styles.webDatePickerInput}
                      placeholder="HH"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempDate ? tempDate.getHours().toString().padStart(2, '0') : ''}
                      onChangeText={(text) => {
                        const hour = parseInt(text);
                        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                          const newDate = new Date(tempDate || new Date());
                          newDate.setHours(hour);
                          setTempDate(newDate);
                        }
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.webDatePickerField}>
                    <Text style={styles.webDatePickerLabel}>Minutes</Text>
                    <TextInput
                      style={styles.webDatePickerInput}
                      placeholder="MM"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tempDate ? tempDate.getMinutes().toString().padStart(2, '0') : ''}
                      onChangeText={(text) => {
                        const minute = parseInt(text);
                        if (!isNaN(minute) && minute >= 0 && minute <= 59) {
                          const newDate = new Date(tempDate || new Date());
                          newDate.setMinutes(minute);
                          setTempDate(newDate);
                        }
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setTempDate(departureDate || new Date());
                  }}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={() => {
                    setDepartureDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.modalConfirmText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#B3D9E6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderWidth: 2,
    borderColor: '#B3D9E6',
  },
  typeButtonSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#60A5FA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  categoryButtonSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  categoryButtonIcon: {
    fontSize: 20,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  conditionButtonSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  conditionButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#666',
  },
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 12,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  authButtonSecondary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  authButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  dateInputWrapper: {
    marginBottom: 12,
  },
  dateInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIcon: {
    flexShrink: 0,
  },
  dateDisplayContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '700' as const,
  },
  timeDisplayText: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '700' as const,
  },
  dateInputPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateTimeInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  webDatePickerContainer: {
    marginBottom: 16,
  },
  webDatePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  webDatePickerField: {
    flex: 1,
  },
  webDatePickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E3A8A',
    marginBottom: 6,
  },
  webDatePickerInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#B3D9E6',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  modalConfirmButton: {
    backgroundColor: '#1E3A8A',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  nativeDateModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  nativePickerContainer: {
    marginBottom: 16,
  },
  datePicker: {
    height: 200,
    width: '100%',
  },
  timePicker: {
    height: 200,
    width: '100%',
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E3A8A',
  },
  checkboxCheck: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700' as const,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  checkboxDisabled: {
    opacity: 0.5,
    borderColor: '#999',
  },
  checkboxLabelDisabled: {
    opacity: 0.5,
    color: '#999',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  discountPreview: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3D9E6',
  },
  discountPreviewLabel: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through' as const,
  },
  discountedPrice: {
    fontSize: 20,
    color: '#1E3A8A',
    fontWeight: '700' as const,
  },
  warningContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E31B23',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E31B23',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningDescription: {
    fontSize: 14,
    color: '#E31B23',
    lineHeight: 20,
    textAlign: 'center',
  },
});
