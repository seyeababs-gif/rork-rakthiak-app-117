import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useOrders } from '@/contexts/OrderContext';
import { CheckCircle2, Bot, TrendingUp, AlertCircle, MessageSquare, Sparkles, ArrowRight } from 'lucide-react-native';

interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  trend?: string;
  accent?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'Élevée' | 'Moyenne' | 'Basse';
  icon: 'ops' | 'bot' | 'payments' | 'trust' | 'design';
  action: string;
}

export default function BilanScreen() {
  const { products, favoriteProducts, userProducts, allUsers } = useMarketplace();
  const { orders } = useOrders();
  const insets = useSafeAreaInsets();

  const metrics = useMemo<SummaryMetric[]>(() => {
    const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const conversionRate = orders.length === 0 ? 0 : (completedOrders / orders.length) * 100;
    return [
      {
        id: 'products',
        label: 'Annonces actives',
        value: products.length.toString(),
        trend: `${userProducts.length} publiées par vous`,
        accent: '#00A651',
      },
      {
        id: 'orders',
        label: 'Commandes suivies',
        value: orders.length.toString(),
        trend: `${completedOrders} terminées`,
        accent: '#007AFF',
      },
      {
        id: 'revenue',
        label: 'Volume Wave',
        value: `${new Intl.NumberFormat('fr-FR').format(totalRevenue)} FCFA`,
        trend: `Panier moyen ${orders.length === 0 ? '0' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(totalRevenue / orders.length)} FCFA`,
        accent: '#E67E22',
      },
      {
        id: 'conversion',
        label: 'Conversion acheteurs',
        value: `${conversionRate.toFixed(1)}%`,
        trend: `${favoriteProducts.length} favoris en attente`,
        accent: '#8E44AD',
      },
    ];
  }, [orders, products.length, userProducts.length, favoriteProducts.length]);

  const suggestionList = useMemo<Suggestion[]>(() => {
    const pendingPayment = orders.filter(order => order.status === 'pending_payment').length;
    const awaitingValidation = orders.filter(order => order.status === 'paid').length;
    const shipped = orders.filter(order => order.status === 'shipped').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const premiumUsers = allUsers.filter(u => u.type === 'premium').length;
    const totalUsers = allUsers.length;
    const premiumShare = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const items: Suggestion[] = [];

    if (pendingPayment > 0) {
      items.push({
        id: 'wave-flow',
        title: 'Automatiser la preuve de paiement Wave',
        description: `${pendingPayment} commande(s) attendent la confirmation du paiement. Ajoutez une capture ou un webhook pour accélérer la validation et éviter les abandons.`,
        priority: 'Élevée',
        icon: 'payments',
        action: 'Créer un flux avec vérification automatique du paiement Wave et suivre la transaction dans l\'onglet Commandes.',
      });
    }

    if (awaitingValidation > 0) {
      items.push({
        id: 'admin-validation',
        title: 'Renforcer le circuit de validation admin',
        description: `${awaitingValidation} commande(s) payée(s) restent à valider. Planifiez des alertes push/sms ou une file prioritaire pour les admins uniquement.`,
        priority: 'Élevée',
        icon: 'ops',
        action: 'Ajouter un tableau kanban admin et des notifications temps réel pour réduire le temps d\'attente.',
      });
    }

    if (shipped === 0 && orders.length > 0) {
      items.push({
        id: 'tracking',
        title: 'Activer le suivi logistique',
        description: 'Aucune commande expédiée. Ajoutez des statuts intermédiaires, tracking transporteurs sénégalais (Yobantel, ColisJet) et messages automatisés aux clients.',
        priority: 'Moyenne',
        icon: 'trust',
        action: 'Créer une timeline visible côté client + notifications WhatsApp ou SMS à chaque mise à jour.',
      });
    }

    if (favoriteProducts.length > 0 && completedOrders < favoriteProducts.length) {
      items.push({
        id: 'retarget',
        title: 'Relancer les favoris pour convertir',
        description: `${favoriteProducts.length} favoris enregistrés. Transformez-les via relances ciblées, coupons flash ou bundles locaux (ex: pack mode Dakar).`,
        priority: 'Moyenne',
        icon: 'design',
        action: 'Créer un module de relance automatique (push/WhatsApp) et afficher les favoris sur la page d\'accueil personnalisée.',
      });
    }

    if (premiumShare < 10 && totalUsers > 0) {
      items.push({
        id: 'premium-boost',
        title: 'Renforcer l\'offre Premium créateurs',
        description: `Seulement ${premiumUsers} utilisateur(s) Premium sur ${totalUsers} (${premiumShare.toFixed(1)}%). Proposez un essai gratuit, badge de confiance et boost visibilité pour accélérer la monétisation.`,
        priority: 'Moyenne',
        icon: 'ops',
        action: 'Installer un paywall léger dans Profil + packages Wave récurrents (mensuel/annuel).',
      });
    }

    if (pendingProducts > 5) {
      items.push({
        id: 'auto-approval',
        title: 'Automatiser la modération des produits',
        description: `${pendingProducts} produits en attente. Considérez un système d\'auto-approbation avec filtres anti-spam pour accélérer la mise en ligne.`,
        priority: 'Basse',
        icon: 'ops',
        action: 'Implémenter des règles d\'auto-validation avec mots-clés et historique vendeur, review manuelle pour cas suspects.',
      });
    }

    items.push({
      id: 'whatsapp-bot',
      title: 'Bot WhatsApp transactionnel',
      description: 'Centraliser toutes les actions (création annonce, suivi commande, support) dans un bot WhatsApp afin de coller aux usages locaux.',
      priority: 'Élevée',
      icon: 'bot',
      action: 'Configurer un bot (Cloud API) avec menu contextuel: publier, payer via Wave, vérifier statut. Synchroniser avec vos contexts pour garder l\'app cohérente.',
    });

    return items;
  }, [orders, favoriteProducts.length, allUsers, products]);

  const pendingValidation = orders.filter(order => order.status === 'paid').length;
  const heroSubtitle = pendingValidation > 0
    ? `${pendingValidation} validation(s) en attente`
    : 'Pipeline fluide, continuez sur cette lancée';

  useEffect(() => {
    const pendingPayment = orders.filter(order => order.status === 'pending_payment').length;
    console.log('[Bilan] Snapshot', {
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingPayment,
      pendingValidation,
      totalUsers: allUsers.length,
      premiumUsers: allUsers.filter(u => u.type === 'premium').length,
    });
  }, [orders, products.length, pendingValidation, allUsers]);

  return (
    <View style={styles.container} testID="bilan-screen">
      <LinearGradient colors={['#052017', '#0B3B2A']} style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.heroLabel}>Vue stratégique</Text>
        <Text style={styles.heroTitle}>Bilan global</Text>
        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        <TouchableOpacity
          style={styles.heroCta}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.heroCtaText}>Voir la file commandes</Text>
          <ArrowRight size={18} color="#052017" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section} testID="summary-metrics">
          <Text style={styles.sectionTitle}>Indicateurs clés</Text>
          <View style={styles.metricsGrid}>
            {metrics.map(metric => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={[styles.metricAccent, { backgroundColor: metric.accent }]} />
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                {metric.trend && <Text style={styles.metricTrend}>{metric.trend}</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section} testID="suggestions-list">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggestions prioritaires</Text>
            <Sparkles size={20} color="#00A651" />
          </View>
          {suggestionList.map(suggestion => {
            const IconComponent = (() => {
              switch (suggestion.icon) {
                case 'bot':
                  return Bot;
                case 'payments':
                  return TrendingUp;
                case 'trust':
                  return CheckCircle2;
                case 'design':
                  return MessageSquare;
                default:
                  return AlertCircle;
              }
            })();

            return (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionIcon}>
                  <IconComponent size={20} color="#fff" />
                </View>
                <View style={styles.suggestionContent}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        suggestion.priority === 'Élevée' && styles.priorityHigh,
                        suggestion.priority === 'Moyenne' && styles.priorityMedium,
                      ]}
                    >
                      <Text style={styles.priorityText}>{suggestion.priority}</Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  <Text style={styles.suggestionAction}>{suggestion.action}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030B08',
  },
  hero: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  heroLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: '700' as const,
  },
  heroTitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    marginBottom: 20,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B5FF9D',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  heroCtaText: {
    color: '#052017',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    backgroundColor: '#06120D',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#E6FFE0',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '48%',
    backgroundColor: '#0B1F17',
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  metricAccent: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  metricLabel: {
    color: '#8CA298',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700' as const,
  },
  metricTrend: {
    color: '#7BD3A3',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#0B1F17',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0F2E21',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 6,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1B442E',
  },
  priorityHigh: {
    backgroundColor: '#FF5A5F33',
  },
  priorityMedium: {
    backgroundColor: '#F2C94C33',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  suggestionDescription: {
    color: '#C7D1CD',
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionAction: {
    color: '#7BD3A3',
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
