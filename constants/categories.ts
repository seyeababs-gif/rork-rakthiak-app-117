import { Category, SubCategory } from '@/types/marketplace';

export interface SubCategoryInfo {
  id: SubCategory;
  name: string;
  icon: string;
  parentCategory: Category;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  color: string;
  gradient: [string, string];
  subCategories?: SubCategoryInfo[];
}

export const subCategories: SubCategoryInfo[] = [
  // Fashion
  { id: 'homme', name: 'Homme', icon: '👨', parentCategory: 'fashion' },
  { id: 'femme', name: 'Femme', icon: '👩', parentCategory: 'fashion' },
  { id: 'unisexe', name: 'Unisexe', icon: '👤', parentCategory: 'fashion' },
  { id: 'enfant_mode', name: 'Enfant', icon: '👧', parentCategory: 'fashion' },
  { id: 'bebe', name: 'Bébé', icon: '👶', parentCategory: 'fashion' },
  { id: 'accessoires_mode', name: 'Accessoires', icon: '👜', parentCategory: 'fashion' },
  { id: 'chaussures', name: 'Chaussures', icon: '👞', parentCategory: 'fashion' },
  { id: 'sacs', name: 'Sacs', icon: '🎒', parentCategory: 'fashion' },
  { id: 'fashion_autres', name: 'Autres', icon: '✨', parentCategory: 'fashion' },

  // Santé & Beauté
  { id: 'maquillage', name: 'Maquillage', icon: '💄', parentCategory: 'sante_beaute' },
  { id: 'soins_visage', name: 'Soins Visage', icon: '🧖‍♀️', parentCategory: 'sante_beaute' },
  { id: 'soins_corps', name: 'Soins Corps', icon: '🧴', parentCategory: 'sante_beaute' },
  { id: 'soins_cheveux', name: 'Soins Cheveux', icon: '💇‍♀️', parentCategory: 'sante_beaute' },
  { id: 'parfums', name: 'Parfums', icon: '👃', parentCategory: 'sante_beaute' },
  { id: 'hygiene', name: 'Hygiène', icon: '🧼', parentCategory: 'sante_beaute' },
  { id: 'sante_beaute_autres', name: 'Autres', icon: '✨', parentCategory: 'sante_beaute' },

  // Téléphone & Tablette
  { id: 'smartphones', name: 'Smartphones', icon: '📱', parentCategory: 'telephone_tablette' },
  { id: 'tablettes', name: 'Tablettes', icon: '📲', parentCategory: 'telephone_tablette' },
  { id: 'accessoires_telephonie', name: 'Accessoires', icon: '🔌', parentCategory: 'telephone_tablette' },
  { id: 'smartwatches', name: 'Montres Connectées', icon: '⌚', parentCategory: 'telephone_tablette' },
  { id: 'telephone_tablette_autres', name: 'Autres', icon: '✨', parentCategory: 'telephone_tablette' },

  // Informatique
  { id: 'ordinateurs_portables', name: 'PC Portables', icon: '💻', parentCategory: 'informatique' },
  { id: 'ordinateurs_bureau', name: 'PC Bureau', icon: '🖥️', parentCategory: 'informatique' },
  { id: 'imprimantes_scanners', name: 'Imprimantes', icon: '🖨️', parentCategory: 'informatique' },
  { id: 'stockage', name: 'Stockage', icon: '💾', parentCategory: 'informatique' },
  { id: 'accessoires_informatique', name: 'Accessoires', icon: '⌨️', parentCategory: 'informatique' },
  { id: 'informatique_autres', name: 'Autres', icon: '✨', parentCategory: 'informatique' },

  // TV & Audio
  { id: 'televiseurs', name: 'Téléviseurs', icon: '📺', parentCategory: 'tv_audio' },
  { id: 'home_cinema', name: 'Home Cinéma', icon: '🔊', parentCategory: 'tv_audio' },
  { id: 'enceintes', name: 'Enceintes', icon: '🔈', parentCategory: 'tv_audio' },
  { id: 'casques_ecouteurs', name: 'Casques', icon: '🎧', parentCategory: 'tv_audio' },
  { id: 'tv_audio_autres', name: 'Autres', icon: '✨', parentCategory: 'tv_audio' },

  // Jeux Vidéo
  { id: 'consoles', name: 'Consoles', icon: '🎮', parentCategory: 'jeux_video' },
  { id: 'jeux_video', name: 'Jeux', icon: '🕹️', parentCategory: 'jeux_video' },
  { id: 'accessoires_gaming', name: 'Accessoires', icon: '🖱️', parentCategory: 'jeux_video' },
  { id: 'jeux_video_autres', name: 'Autres', icon: '✨', parentCategory: 'jeux_video' },

  // Photo & Vidéo
  { id: 'appareils_photo', name: 'Appareils Photo', icon: '📷', parentCategory: 'photo_video' },
  { id: 'cameras', name: 'Caméras', icon: '📹', parentCategory: 'photo_video' },
  { id: 'drones', name: 'Drones', icon: '🚁', parentCategory: 'photo_video' },
  { id: 'accessoires_photo', name: 'Accessoires', icon: '🔭', parentCategory: 'photo_video' },
  { id: 'photo_video_autres', name: 'Autres', icon: '✨', parentCategory: 'photo_video' },

  // Maison
  { id: 'meubles', name: 'Meubles', icon: '🛋️', parentCategory: 'maison' },
  { id: 'decoration', name: 'Décoration', icon: '🖼️', parentCategory: 'maison' },
  { id: 'electromenager', name: 'Électroménager', icon: '🔌', parentCategory: 'maison' },
  { id: 'vaisselle', name: 'Vaisselle', icon: '🍽️', parentCategory: 'maison' },
  { id: 'bricolage', name: 'Bricolage', icon: '🔨', parentCategory: 'maison' },
  { id: 'jardin', name: 'Jardin', icon: '🌻', parentCategory: 'maison' },
  { id: 'fournitures_maison', name: 'Fournitures', icon: '📝', parentCategory: 'maison' },
  { id: 'maison_autres', name: 'Autres', icon: '✨', parentCategory: 'maison' },

  // Enfant
  { id: 'jouets', name: 'Jouets', icon: '🧸', parentCategory: 'enfant' },
  { id: 'puericulture', name: 'Puériculture', icon: '🍼', parentCategory: 'enfant' },
  { id: 'ecole', name: 'École', icon: '🎒', parentCategory: 'enfant' },
  { id: 'enfant_autres', name: 'Autres', icon: '✨', parentCategory: 'enfant' },

  // Sport
  { id: 'fitness', name: 'Fitness', icon: '💪', parentCategory: 'sport' },
  { id: 'sports_collectifs', name: 'Sports Co.', icon: '⚽', parentCategory: 'sport' },
  { id: 'velo', name: 'Vélo', icon: '🚲', parentCategory: 'sport' },
  { id: 'camping', name: 'Camping', icon: '⛺', parentCategory: 'sport' },
  { id: 'nutrition_sportive', name: 'Nutrition', icon: '🥤', parentCategory: 'sport' },
  { id: 'sport_autres', name: 'Autres', icon: '✨', parentCategory: 'sport' },

  // Supermarché
  { id: 'alimentation', name: 'Alimentation', icon: '🍎', parentCategory: 'supermarche' },
  { id: 'boissons', name: 'Boissons', icon: '🥤', parentCategory: 'supermarche' },
  { id: 'produits_menagers', name: 'Produits Ménagers', icon: '🧹', parentCategory: 'supermarche' },
  { id: 'supermarche_autres', name: 'Autres', icon: '✨', parentCategory: 'supermarche' },

  // Librairie
  { id: 'livres', name: 'Livres', icon: '📚', parentCategory: 'librairie' },
  { id: 'fournitures_scolaires', name: 'Scolaire', icon: '📏', parentCategory: 'librairie' },
  { id: 'papeterie', name: 'Papeterie', icon: '✏️', parentCategory: 'librairie' },
  { id: 'librairie_autres', name: 'Autres', icon: '✨', parentCategory: 'librairie' },

  // Musique
  { id: 'instruments', name: 'Instruments', icon: '🎸', parentCategory: 'musique' },
  { id: 'sonorisation', name: 'Sonorisation', icon: '🔉', parentCategory: 'musique' },
  { id: 'musique_autres', name: 'Autres', icon: '✨', parentCategory: 'musique' },

  // Véhicules
  { id: 'voitures', name: 'Voitures', icon: '🚗', parentCategory: 'vehicles' },
  { id: 'motos', name: 'Motos', icon: '🏍️', parentCategory: 'vehicles' },
  { id: 'pieces_detachees', name: 'Pièces Détachées', icon: '🔧', parentCategory: 'vehicles' },
  { id: 'location_vehicules', name: 'Location', icon: '🔑', parentCategory: 'vehicles' },
  { id: 'vehicles_autres', name: 'Autres', icon: '✨', parentCategory: 'vehicles' },

  // Transport & Livraison (Service)
  { id: 'covoiturage', name: 'Covoiturage', icon: '🚗', parentCategory: 'delivery' },
  { id: 'thiaktiak', name: 'Thiak Thiak', icon: '🛵', parentCategory: 'delivery' },
  { id: 'gp', name: 'GP', icon: '✈️', parentCategory: 'delivery' },
  { id: 'conteneur', name: 'Conteneur', icon: '🚢', parentCategory: 'delivery' },
  { id: 'demenagement', name: 'Déménagement', icon: '📦', parentCategory: 'delivery' },
  { id: 'delivery_autres', name: 'Autres', icon: '✨', parentCategory: 'delivery' },
  
  // Autres
  { id: 'autres', name: 'Autres', icon: '✨', parentCategory: 'autres' },
];

export const categories: CategoryInfo[] = [
  {
    id: 'all',
    name: 'Tout',
    icon: '🏪',
    color: '#1E3A8A',
    gradient: ['#1E3A8A', '#3B82F6'],
  },
  {
    id: 'sante_beaute',
    name: 'Santé & Beauté',
    icon: '💄',
    color: '#F43F5E',
    gradient: ['#F43F5E', '#FB7185'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'sante_beaute'),
  },
  {
    id: 'telephone_tablette',
    name: 'Tél & Tablettes',
    icon: '📱',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'telephone_tablette'),
  },
  {
    id: 'informatique',
    name: 'Informatique',
    icon: '💻',
    color: '#0EA5E9',
    gradient: ['#0EA5E9', '#38BDF8'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'informatique'),
  },
  {
    id: 'tv_audio',
    name: 'TV & Audio',
    icon: '📺',
    color: '#6366F1',
    gradient: ['#6366F1', '#818CF8'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'tv_audio'),
  },
  {
    id: 'jeux_video',
    name: 'Jeux Vidéo',
    icon: '🎮',
    color: '#A855F7',
    gradient: ['#A855F7', '#C084FC'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'jeux_video'),
  },
  {
    id: 'photo_video',
    name: 'Photo & Vidéo',
    icon: '📷',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'photo_video'),
  },
  {
    id: 'fashion',
    name: 'Mode',
    icon: '👔',
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'fashion'),
  },
  {
    id: 'maison',
    name: 'Maison',
    icon: '🏠',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'maison'),
  },
  {
    id: 'enfant',
    name: 'Enfant',
    icon: '🧸',
    color: '#F97316',
    gradient: ['#F97316', '#FB923C'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'enfant'),
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: '⚽',
    color: '#22C55E',
    gradient: ['#22C55E', '#4ADE80'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'sport'),
  },
  {
    id: 'supermarche',
    name: 'Supermarché',
    icon: '🛒',
    color: '#14B8A6',
    gradient: ['#14B8A6', '#2DD4BF'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'supermarche'),
  },
  {
    id: 'librairie',
    name: 'Librairie',
    icon: '📚',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#22D3EE'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'librairie'),
  },
  {
    id: 'musique',
    name: 'Musique',
    icon: '🎵',
    color: '#E11D48',
    gradient: ['#E11D48', '#FB7185'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'musique'),
  },
  {
    id: 'vehicles',
    name: 'Véhicules',
    icon: '🚗',
    color: '#64748B',
    gradient: ['#64748B', '#94A3B8'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'vehicles'),
  },
  {
    id: 'delivery',
    name: 'Livraison',
    icon: '🚚',
    color: '#0284C7',
    gradient: ['#0284C7', '#38BDF8'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'delivery'),
  },
  {
    id: 'autres',
    name: 'Autres',
    icon: '✨',
    color: '#94A3B8',
    gradient: ['#94A3B8', '#CBD5E1'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'autres'),
  },
];

export const getSubCategoriesForCategory = (categoryId: Category): SubCategoryInfo[] => {
  if (categoryId === 'all') return subCategories;
  return subCategories.filter(sub => sub.parentCategory === categoryId);
};

export const getCategoryInfo = (categoryId: Category): CategoryInfo | undefined => {
  return categories.find(cat => cat.id === categoryId);
};
