import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ShowToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export const [ToastProvider, useToast] = createContextHook(() => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }: ShowToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: Toast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const showAlert = useCallback((title: string, message: string, buttons?: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[]) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (buttons && buttons.length > 0) {
        const okButton = buttons.find(b => b.style !== 'cancel');
        const cancelButton = buttons.find(b => b.style === 'cancel');
        if (confirmed && okButton?.onPress) {
          okButton.onPress();
        } else if (!confirmed && cancelButton?.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons as any);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return useMemo(() => ({
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showAlert,
    hideToast,
    hideAllToasts,
  }), [toasts, showToast, showSuccess, showError, showInfo, showWarning, showAlert, hideToast, hideAllToasts]);
});
