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
  { id: 'homme', name: 'Homme', icon: '👨', parentCategory: 'fashion' },
  { id: 'femme', name: 'Femme', icon: '👩', parentCategory: 'fashion' },
  { id: 'enfant', name: 'Enfant', icon: '👧', parentCategory: 'fashion' },
  { id: 'bebe', name: 'Bébé', icon: '👶', parentCategory: 'fashion' },
  { id: 'smartphones', name: 'Smartphones', icon: '📱', parentCategory: 'electronics' },
  { id: 'ordinateurs', name: 'Ordinateurs', icon: '💻', parentCategory: 'electronics' },
  { id: 'accessoires', name: 'Accessoires', icon: '🎧', parentCategory: 'electronics' },
  { id: 'voitures', name: 'Voitures', icon: '🚗', parentCategory: 'vehicles' },
  { id: 'motos', name: 'Motos', icon: '🏍️', parentCategory: 'vehicles' },
  { id: 'meubles', name: 'Meubles', icon: '🛋️', parentCategory: 'home' },
  { id: 'decoration', name: 'Décoration', icon: '🖼️', parentCategory: 'home' },
  { id: 'menage', name: 'Ménage', icon: '🧹', parentCategory: 'home' },
  { id: 'vtc', name: 'VTC', icon: '🚖', parentCategory: 'delivery' },
  { id: 'thiaktiak', name: 'Thiak Thiak', icon: '🛵', parentCategory: 'delivery' },
  { id: 'gp', name: 'GP', icon: '✈️', parentCategory: 'delivery' },
  { id: 'conteneur', name: 'Conteneur par bateau', icon: '🚢', parentCategory: 'delivery' },
  { id: 'autres', name: 'Autres', icon: '📦', parentCategory: 'delivery' },
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
    id: 'electronics',
    name: 'Électronique',
    icon: '📱',
    color: '#0EA5E9',
    gradient: ['#0EA5E9', '#3B82F6'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'electronics'),
  },
  {
    id: 'fashion',
    name: 'Mode',
    icon: '👔',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'fashion'),
  },
  {
    id: 'home',
    name: 'Maison',
    icon: '🏠',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'home'),
  },
  {
    id: 'vehicles',
    name: 'Véhicules',
    icon: '🚗',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'vehicles'),
  },
  {
    id: 'delivery',
    name: 'Transport & Livraison',
    icon: '🚚',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#0891B2'],
    subCategories: subCategories.filter(sub => sub.parentCategory === 'delivery'),
  },
];

export const getSubCategoriesForCategory = (categoryId: Category): SubCategoryInfo[] => {
  if (categoryId === 'all') return subCategories;
  return subCategories.filter(sub => sub.parentCategory === categoryId);
};

export const getCategoryInfo = (categoryId: Category): CategoryInfo | undefined => {
  return categories.find(cat => cat.id === categoryId);
};
