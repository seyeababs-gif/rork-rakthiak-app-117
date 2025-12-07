import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet } from "react-native";
import { MarketplaceProvider, useMarketplace } from "@/contexts/MarketplaceContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import GlobalAlert from "@/components/GlobalAlert";
import { queryClient } from "@/lib/queryClient";

SplashScreen.preventAutoHideAsync();

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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Une erreur est survenue</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'Erreur inconnue'}
          </Text>
          <Text style={errorStyles.stack}>
            {this.state.error?.stack}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E31B23',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  stack: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    console.log('RootLayout mounted');
    try {
      SplashScreen.hideAsync();
      console.log('SplashScreen hidden');
    } catch (error) {
      console.error('Error hiding splash screen:', error);
    }
  }, []);

  console.log('RootLayout rendering');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NotificationProvider>
            <MarketplaceProvider>
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
            </MarketplaceProvider>
          </NotificationProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
