import { Tabs } from "expo-router";
import { Home, PlusCircle, Package, User, ShoppingCart, Shield } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useCart } from "@/contexts/CartContext";
import { useMarketplace } from "@/contexts/MarketplaceContext";

function CartBadge({ color, size }: { color: string; size: number }) {
  const { getCartItemsCount } = useCart();
  const count = getCartItemsCount();

  return (
    <View>
      <ShoppingCart color={color} size={size} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { currentUser } = useMarketplace();
  const isAdmin = currentUser?.isAdmin === true;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "#94A3B8",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Panier",
          tabBarIcon: ({ color, size }) => <CartBadge color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Vendre",
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Commandes",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
          href: isAdmin ? '/admin' : null,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#E31B23',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
