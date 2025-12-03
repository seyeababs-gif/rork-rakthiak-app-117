import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'rk_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.1';

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY && cached.version === CACHE_VERSION) {
      return cached.data;
    }
    
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      let stored: string | null = null;
      
      if (Platform.OS === 'web') {
        stored = localStorage.getItem(storageKey);
      } else {
        stored = await AsyncStorage.getItem(storageKey);
      }
      
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() - entry.timestamp < CACHE_EXPIRY && entry.version === CACHE_VERSION) {
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }
    
    return null;
  }
  
  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    
    this.memoryCache.set(key, entry);
    
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const serialized = JSON.stringify(entry);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, serialized);
      } else {
        await AsyncStorage.setItem(storageKey, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      if (Platform.OS === 'web') {
        localStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
  
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export const cache = new CacheManager();
