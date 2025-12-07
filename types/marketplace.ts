export type Category = 
  | 'telephone_tablette' 
  | 'informatique' 
  | 'tv_audio' 
  | 'photo_video' 
  | 'jeux_video' 
  | 'fashion' 
  | 'sante_beaute' 
  | 'maison' 
  | 'enfant' 
  | 'sport' 
  | 'supermarche' 
  | 'librairie' 
  | 'musique' 
  | 'vehicles' 
  | 'delivery' 
  | 'autres' 
  | 'all';

export type SubCategory = 
  // Fashion
  | 'homme' 
  | 'femme' 
  | 'unisexe'
  | 'enfant_mode' 
  | 'bebe'
  | 'accessoires_mode'
  | 'chaussures'
  | 'sacs'
  | 'fashion_autres'
  // Sante & Beaute
  | 'maquillage'
  | 'soins_visage'
  | 'soins_corps'
  | 'soins_cheveux'
  | 'parfums'
  | 'hygiene'
  | 'sante_beaute_autres'
  // Telephone & Tablette
  | 'smartphones'
  | 'tablettes'
  | 'accessoires_telephonie'
  | 'smartwatches'
  | 'telephone_tablette_autres'
  // Informatique
  | 'ordinateurs_portables'
  | 'ordinateurs_bureau'
  | 'imprimantes_scanners'
  | 'stockage'
  | 'accessoires_informatique'
  | 'informatique_autres'
  // TV & Audio
  | 'televiseurs'
  | 'home_cinema'
  | 'enceintes'
  | 'casques_ecouteurs'
  | 'tv_audio_autres'
  // Jeux Video
  | 'consoles'
  | 'jeux_video'
  | 'accessoires_gaming'
  | 'jeux_video_autres'
  // Photo & Video
  | 'appareils_photo'
  | 'cameras'
  | 'drones'
  | 'accessoires_photo'
  | 'photo_video_autres'
  // Maison
  | 'meubles'
  | 'decoration'
  | 'electromenager'
  | 'vaisselle'
  | 'bricolage'
  | 'jardin'
  | 'fournitures_maison'
  | 'maison_autres'
  // Enfant (Jeux & Puericulture)
  | 'jouets'
  | 'puericulture'
  | 'ecole'
  | 'enfant_autres'
  // Sport
  | 'fitness'
  | 'sports_collectifs'
  | 'velo'
  | 'camping'
  | 'nutrition_sportive'
  | 'sport_autres'
  // Supermarche
  | 'alimentation'
  | 'boissons'
  | 'produits_menagers'
  | 'supermarche_autres'
  // Librairie
  | 'livres'
  | 'fournitures_scolaires'
  | 'papeterie'
  | 'librairie_autres'
  // Musique
  | 'instruments'
  | 'sonorisation'
  | 'musique_autres'
  // Vehicles
  | 'voitures'
  | 'motos'
  | 'pieces_detachees'
  | 'location_vehicules'
  | 'vehicles_autres'
  // Delivery
  | 'covoiturage'
  | 'thiaktiak'
  | 'gp'
  | 'conteneur'
  | 'demenagement'
  | 'delivery_autres'
  // General
  | 'autres'
  | 'all';

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export type ListingType = 'product' | 'service';

export interface ServiceDetails {
  departureLocation?: string;
  arrivalLocation?: string;
  departureDate?: string;
  arrivalDate?: string;
  pricePerKg?: number;
  tripPrice?: number;
  vehicleType?: string;
  availableSeats?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  subCategory?: SubCategory;
  location: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone: string;
  createdAt: Date;
  condition?: 'new' | 'used' | 'refurbished';
  status: ProductStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: string;
  averageRating?: number;
  reviewCount?: number;
  listingType?: ListingType;
  serviceDetails?: ServiceDetails;
  stockQuantity?: number;
  isOutOfStock?: boolean;
  hasDiscount?: boolean;
  discountPercent?: number;
  originalPrice?: number;
}

export type UserType = 'standard' | 'premium';

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  password: string;
  location: string;
  type: UserType;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  email?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  joinedDate?: Date;
  premiumPaymentPending?: boolean;
  premiumRequestDate?: Date;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPhone?: string;
}

export interface Message {
  id: string;
  productId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  productId: string;
  product: Product;
  otherUser: User;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface SellerRating {
  sellerId: string;
  averageRating: number;
  totalReviews: number;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'validated' | 'rejected' | 'shipped' | 'completed';

export interface OrderItem {
  product: Product;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'wave';
  waveTransactionId?: string;
  createdAt: Date;
  paidAt?: Date;
  validatedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  shippedAt?: Date;
  completedAt?: Date;
  hasReview?: boolean;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
}

export type NotificationType = 
  | 'product_published'
  | 'product_approved'
  | 'product_rejected'
  | 'order_paid'
  | 'order_validated'
  | 'order_rejected'
  | 'order_shipped'
  | 'order_completed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}
