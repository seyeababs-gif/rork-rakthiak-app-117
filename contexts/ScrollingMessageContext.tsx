import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@scrolling_message';
const GLOBAL_PREMIUM_KEY = '@global_premium_enabled';
const DEFAULT_MESSAGE = 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal';

export const [ScrollingMessageProvider, useScrollingMessage] = createContextHook(() => {
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  const [isGlobalPremiumEnabled, setIsGlobalPremiumEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMessage();
  }, []);

  const loadMessage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessage(stored);
      }
      
      const premiumEnabled = await AsyncStorage.getItem(GLOBAL_PREMIUM_KEY);
      if (premiumEnabled !== null) {
        setIsGlobalPremiumEnabled(premiumEnabled === 'true');
      }
    } catch (error) {
      console.error('[SCROLLING MESSAGE] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMessage = async (newMessage: string) => {
    try {
      setMessage(newMessage);
      await AsyncStorage.setItem(STORAGE_KEY, newMessage);
      return { success: true };
    } catch (error) {
      console.error('[SCROLLING MESSAGE] Failed to save:', error);
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    }
  };

  const updateGlobalPremium = async (enabled: boolean) => {
    try {
      setIsGlobalPremiumEnabled(enabled);
      await AsyncStorage.setItem(GLOBAL_PREMIUM_KEY, enabled ? 'true' : 'false');
      console.log('[GLOBAL PREMIUM] Updated:', enabled);
      return { success: true };
    } catch (error) {
      console.error('[GLOBAL PREMIUM] Failed to save:', error);
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    }
  };

  return {
    message,
    updateMessage,
    isGlobalPremiumEnabled,
    updateGlobalPremium,
    isLoading,
  };
});
