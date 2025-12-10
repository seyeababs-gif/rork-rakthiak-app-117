import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@scrolling_message';
const DEFAULT_MESSAGE = 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal';

export const [ScrollingMessageProvider, useScrollingMessage] = createContextHook(() => {
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
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

  return {
    message,
    updateMessage,
    isLoading,
  };
});
