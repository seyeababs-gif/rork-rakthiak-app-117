import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMarketplace } from '@/contexts/MarketplaceContext';

export interface GlobalSettings {
  id: string;
  isGlobalPremiumEnabled: boolean;
  scrollingMessage: string;
  commissionPercentage: number;
  updatedAt: Date;
  updatedBy?: string;
}

const FIXED_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    console.log('[GLOBAL SETTINGS] Fetching global settings...');
    
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('id', FIXED_SETTINGS_ID)
      .maybeSingle();
    
    if (error) {
      console.error('[GLOBAL SETTINGS] Error loading settings:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[GLOBAL SETTINGS] No settings found, returning defaults');
      return {
        id: FIXED_SETTINGS_ID,
        isGlobalPremiumEnabled: false,
        scrollingMessage: 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
        commissionPercentage: 10.0,
        updatedAt: new Date(),
      };
    }
    
    const settings: GlobalSettings = {
      id: data.id,
      isGlobalPremiumEnabled: data.is_global_premium_enabled || false,
      scrollingMessage: data.scrolling_message || 'Bienvenue',
      commissionPercentage: parseFloat(data.commission_percentage) || 10.0,
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by,
    };
    
    console.log('[GLOBAL SETTINGS] Settings loaded:', settings);
    return settings;
  } catch (error) {
    console.error('[GLOBAL SETTINGS] Failed to load settings:', error);
    return {
      id: FIXED_SETTINGS_ID,
      isGlobalPremiumEnabled: false,
      scrollingMessage: 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
      commissionPercentage: 10.0,
      updatedAt: new Date(),
    };
  }
};

export const [GlobalSettingsProvider, useGlobalSettings] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { currentUser } = useMarketplace();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: fetchGlobalSettings,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<GlobalSettings>) => {
      console.log('[GLOBAL SETTINGS] 🔄 Starting update process...');
      console.log('[GLOBAL SETTINGS] Current user:', currentUser?.id, currentUser?.isSuperAdmin);
      
      if (!currentUser?.isSuperAdmin) {
        const errorMsg = 'Seul le super administrateur peut modifier les paramètres globaux';
        console.error('[GLOBAL SETTINGS] ❌ Permission denied:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const updateData: any = {
        updated_by: currentUser.id,
      };
      
      if (updates.isGlobalPremiumEnabled !== undefined) {
        updateData.is_global_premium_enabled = updates.isGlobalPremiumEnabled;
      }
      if (updates.scrollingMessage !== undefined) {
        updateData.scrolling_message = updates.scrollingMessage;
      }
      if (updates.commissionPercentage !== undefined) {
        updateData.commission_percentage = updates.commissionPercentage;
      }
      
      console.log('[GLOBAL SETTINGS] 📤 Updating data:', JSON.stringify(updateData, null, 2));
      
      const { data, error } = await supabase
        .from('global_settings')
        .update(updateData)
        .eq('id', FIXED_SETTINGS_ID)
        .select()
        .single();
      
      if (error) {
        console.error('[GLOBAL SETTINGS] ❌ Update failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Erreur Supabase: ${error.message} (Code: ${error.code})`);
      }
      
      if (!data) {
        console.error('[GLOBAL SETTINGS] ❌ No data returned after update');
        throw new Error('Aucune donnée retournée après la sauvegarde');
      }
      
      console.log('[GLOBAL SETTINGS] ✅ Settings updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('[GLOBAL SETTINGS] ✅ Mutation success, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] });
    },
    onError: (error: any) => {
      console.error('[GLOBAL SETTINGS] ❌ Mutation error:', error);
    },
  });
  
  const updateSettings = async (updates: Partial<GlobalSettings>) => {
    try {
      console.log('[GLOBAL SETTINGS] 🚀 updateSettings called with:', updates);
      await updateSettingsMutation.mutateAsync(updates);
      return { success: true };
    } catch (error: any) {
      console.error('[GLOBAL SETTINGS] ❌ Failed to update settings:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la mise à jour' 
      };
    }
  };
  
  const isPremium = settings?.isGlobalPremiumEnabled || false;
  const bannerMessage = settings?.scrollingMessage || 'Bienvenue sur Rakthiak';
  const commissionRate = settings?.commissionPercentage || 10.0;
  
  return {
    settings: settings || {
      id: FIXED_SETTINGS_ID,
      isGlobalPremiumEnabled: false,
      scrollingMessage: 'Bienvenue sur Rakthiak - Achetez et vendez facilement au Sénégal',
      commissionPercentage: 10.0,
      updatedAt: new Date(),
    },
    isPremium,
    bannerMessage,
    commissionRate,
    isLoading,
    updateSettings,
    isUpdating: updateSettingsMutation.isPending,
  };
});
