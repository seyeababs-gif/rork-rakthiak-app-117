import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://yhdexpkqtfxmhcpcydcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZGV4cGtxdGZ4bWhjcGN5ZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODU3ODEsImV4cCI6MjA3OTI2MTc4MX0.GGUwjQmKOHeK0UgmF4eDndfGnnpRcnUFDOc535ZaA_g';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  }
  return AsyncStorage as any;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'marketplace-app',
    },
  },
});
