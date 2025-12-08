import createContextHook from '@nkzw/create-context-hook';
import { useCallback } from 'react';
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

const fetchGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    console.log('[GLOBAL SETTINGS] Fetching global settings...');
    
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('[GLOBAL SETTINGS] Error loading settings:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('[GLOBAL SETTINGS] No settings found, returning defaults');
      return {
        id: '00000000-0000-0000-0000-000000000001',
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
      id: '00000000-0000-0000-0000-000000000001',
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
      if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) {
        throw new Error('Non autorisé');
      }
      
      const updateData: any = {};
      
      if (updates.isGlobalPremiumEnabled !== undefined) {
        updateData.is_global_premium_enabled = updates.isGlobalPremiumEnabled;
      }
      if (updates.scrollingMessage !== undefined) {
        updateData.scrolling_message = updates.scrollingMessage;
      }
      if (updates.commissionPercentage !== undefined) {
        updateData.commission_percentage = updates.commissionPercentage;
      }
      
      updateData.updated_by = currentUser?.id;
      
      console.log('[GLOBAL SETTINGS] Updating settings:', updateData);
      
      const { error } = await supabase
        .from('global_settings')
        .update(updateData)
        .eq('id', '00000000-0000-0000-0000-000000000001');
      
      if (error) {
        console.error('[GLOBAL SETTINGS] Update error:', error);
        throw error;
      }
      
      console.log('[GLOBAL SETTINGS] Settings updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] });
    },
  });
  
  const updateSettings = useCallback(
    async (updates: Partial<GlobalSettings>) => {
      try {
        await updateSettingsMutation.mutateAsync(updates);
        return { success: true };
      } catch (error: any) {
        console.error('[GLOBAL SETTINGS] Failed to update settings:', error);
        return { success: false, error: error.message || 'Erreur lors de la mise à jour' };
      }
    },
    [updateSettingsMutation.mutateAsync]
  );
  
  const isPremium = settings?.isGlobalPremiumEnabled || false;
  const bannerMessage = settings?.scrollingMessage || 'Bienvenue sur Rakthiak';
  const commissionRate = settings?.commissionPercentage || 10.0;
  
  return {
    settings: settings || {
      id: '00000000-0000-0000-0000-000000000001',
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
