import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MarketplaceProvider, useMarketplace } from "@/contexts/MarketplaceContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ScrollingMessageProvider } from "@/contexts/ScrollingMessageContext";
import ToastContainer from "@/components/ToastContainer";
import GlobalAlert from "@/components/GlobalAlert";
import { queryClient } from "@/lib/queryClient";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const updateOrCreateMeta = (property: string, content: string, isName = false) => {
        const attr = isName ? 'name' : 'property';
        let meta = document.querySelector(`meta[${attr}="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      document.title = 'Rakthiak - Marketplace Sénégal';
      
      updateOrCreateMeta('description', 'Achetez et vendez facilement au Sénégal. Livraison rapide, paiement sécurisé Wave. Mode, Électronique, Beauté et plus.', true);
      updateOrCreateMeta('og:site_name', 'Rakthiak');
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('og:title', 'Rakthiak - Marketplace Sénégal');
      updateOrCreateMeta('og:description', 'Achetez et vendez facilement au Sénégal. Livraison rapide, paiement sécurisé Wave. Mode, Électronique, Beauté et plus.');
      updateOrCreateMeta('og:url', 'https://rakthiak.com');
      updateOrCreateMeta('og:image', 'https://rakthiak.com/og-image.jpg');
      
      updateOrCreateMeta('twitter:card', 'summary_large_image', true);
      updateOrCreateMeta('twitter:title', 'Rakthiak - Marketplace Sénégal', true);
      updateOrCreateMeta('twitter:description', 'Achetez et vendez facilement au Sénégal. Livraison rapide, paiement sécurisé Wave. Mode, Électronique, Beauté et plus.', true);
      updateOrCreateMeta('twitter:image', 'https://rakthiak.com/og-image.jpg', true);
    }
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: "Retour" }}>
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          title: "Détails",
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="shop/[sellerId]" 
        options={{ 
          title: "Boutique",
          headerShown: true,
        }} 
      />
      <Stack.Screen name="bilan" options={{ headerShown: false }} />
    </Stack>
  );
}

function NotificationSetup() {
  const { currentUser } = useMarketplace();
  const { registerForPushNotifications, loadNotifications } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      registerForPushNotifications(currentUser.id);
      loadNotifications(currentUser.id);
    }
  }, [currentUser, registerForPushNotifications, loadNotifications]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NotificationProvider>
          <MarketplaceProvider>
            <ScrollingMessageProvider>
              <CartProvider>
                <OrderProvider>
                  <ReviewProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <AuthGuard>
                        <NotificationSetup />
                        <RootLayoutNav />
                        <ToastContainer />
                        <GlobalAlert />
                      </AuthGuard>
                    </GestureHandlerRootView>
                  </ReviewProvider>
                </OrderProvider>
              </CartProvider>
            </ScrollingMessageProvider>
          </MarketplaceProvider>
        </NotificationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
