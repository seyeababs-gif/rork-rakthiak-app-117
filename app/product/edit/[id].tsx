import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, Image as ImageIcon, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { categories } from '@/constants/categories';
import { Category } from '@/types/marketplace';

export default function EditProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, updateProduct, getMaxImages, currentUser } = useMarketplace();

  const product = getProduct(id || '');

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<Category>('electronics');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('used');
  const [images, setImages] = useState<string[]>([]);
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [manageStock, setManageStock] = useState<boolean>(false);
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(false);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<string>('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description);
      setPrice(product.price.toString());
      setLocation(product.location);
      setCategory(product.category);
      setCondition(product.condition || 'used');
      setImages(product.images);
      setManageStock(product.stockQuantity !== undefined);
      setStockQuantity(product.stockQuantity ? product.stockQuantity.toString() : '');
      setIsOutOfStock(product.isOutOfStock || false);
      setHasDiscount(product.hasDiscount || false);
      setDiscountPercent(product.discountPercent ? product.discountPercent.toString() : '');
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.errorText}>Produit introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (product.sellerId !== currentUser?.id) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.errorText}>Vous n&apos;êtes pas autorisé à modifier ce produit</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const pickImage = async () => {
    const maxImages = getMaxImages();
    if (images.length >= maxImages) {
      Alert.alert(
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
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
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
      Alert.alert(
        'Limite atteinte',
        currentUser?.type === 'standard'
          ? 'Vous pouvez ajouter maximum 2 photos par produit. Passez à Premium pour un accès illimité.'
          : 'Limite de photos atteinte.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Non disponible', 'La caméra n&apos;est pas disponible sur le web.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avez besoin de votre permission pour accéder à la caméra.');
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
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description');
      return;
    }
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Erreur', 'Veuillez entrer un prix valide');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une localisation');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
      return;
    }

    updateProduct(product.id, {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      location: location.trim(),
      category,
      condition,
      images,
      stockQuantity: manageStock && stockQuantity ? Number(stockQuantity) : undefined,
      isOutOfStock,
      hasDiscount,
      discountPercent: hasDiscount && discountPercent ? Number(discountPercent) : undefined,
      originalPrice: hasDiscount && discountPercent ? Number(price) : undefined,
    });

    Alert.alert('Succès', 'Votre annonce a été modifiée !', [
      {
        text: 'OK',
        onPress: () => {
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Modifier l&apos;annonce</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.type === 'standard'
              ? 'Compte Standard - 2 photos/produit'
              : 'Compte Premium - Accès illimité'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
              <ImageIcon size={24} color="#00A651" />
              <Text style={styles.addImageText}>Galerie</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                <Camera size={24} color="#00A651" />
                <Text style={styles.addImageText}>Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de l&apos;annonce"
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie</Text>
          <View style={styles.categoriesGrid}>
            {categories.filter(c => c.id !== 'all').map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonSelected,
                ]}
                onPress={() => setCategory(cat.id)}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réduction / Promotion</Text>
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setHasDiscount(!hasDiscount)}
          >
            <View style={[styles.checkbox, hasDiscount && styles.checkboxChecked]}>
              {hasDiscount && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Ce produit est en promotion</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion du stock</Text>
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setManageStock(!manageStock)}
          >
            <View style={[styles.checkbox, manageStock && styles.checkboxChecked]}>
              {manageStock && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Gérer le stock de ce produit</Text>
          </TouchableOpacity>
          {manageStock && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Quantité disponible"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setIsOutOfStock(!isOutOfStock)}
              >
                <View style={[styles.checkbox, isOutOfStock && styles.checkboxChecked]}>
                  {isOutOfStock && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Produit en rupture de stock</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
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
    color: '#000',
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#00A651',
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
    borderColor: '#00A651',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: '#00A651',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
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
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#00A651',
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
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  conditionButtonSelected: {
    backgroundColor: '#00A651',
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
    backgroundColor: '#00A651',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#00A651',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
    borderColor: '#00A651',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00A651',
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
  discountPreview: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00A651',
  },
  discountPreviewLabel: {
    fontSize: 14,
    color: '#00A651',
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
    color: '#00A651',
    fontWeight: '700' as const,
  },
});
