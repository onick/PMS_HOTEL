import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionStore, type Subscription } from '@/store/subscriptionStore';

export function useSubscription(hotelId?: string) {
  const {
    subscription,
    planLimits,
    isLoading: storeLoading,
    setSubscription,
    setLoading,
    canUseFeature,
    isWithinLimit,
    getRemainingLimit,
    isTrialing,
    isActive,
    needsPayment,
  } = useSubscriptionStore();

  // Fetch subscription from Supabase
  const { data: subscriptionData, isLoading: queryLoading } = useQuery({
    queryKey: ['subscription', hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      if (!hotelId) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('hotel_id', hotelId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as Subscription;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update store when subscription data changes
  useEffect(() => {
    if (subscriptionData) {
      setSubscription(subscriptionData);
    }
    setLoading(queryLoading);
  }, [subscriptionData, queryLoading, setSubscription, setLoading]);

  return {
    subscription,
    planLimits,
    isLoading: storeLoading || queryLoading,
    canUseFeature,
    isWithinLimit,
    getRemainingLimit,
    isTrialing,
    isActive,
    needsPayment,
    
    // Helper methods
    plan: subscription?.plan || 'FREE',
    status: subscription?.status,
  };
}
