import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MarketplaceProvider, useMarketplace } from "@/contexts/MarketplaceContext";
import { CartContext } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import GlobalAlert from "@/components/GlobalAlert";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
  },
});

function RootLayoutNav() {
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
            <CartContext>
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
            </CartContext>
          </MarketplaceProvider>
        </NotificationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
