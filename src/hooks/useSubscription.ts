import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSubscriptionStore, type Subscription } from '@/store/subscriptionStore';

export function useSubscription(hotelId?: string) {
  const {
    subscription,
    planLimits,
    setSubscription,
    canUseFeature,
    isWithinLimit,
    getRemainingLimit,
    isTrialing,
    isActive,
    needsPayment,
  } = useSubscriptionStore();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      try {
        const res = await api.getCurrentSubscription();
        return res.data;
      } catch (error: any) {
        if (error?.status === 404) return null;
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!data) return;

    const normalized: Subscription = {
      id: String(data.id),
      hotelId: String(data.hotel_id),
      plan: data.plan,
      status: data.status,
      currentPeriodStart: data.current_period_start || new Date().toISOString(),
      currentPeriodEnd: data.current_period_end || new Date().toISOString(),
      cancelAtPeriodEnd: false,
      stripeCustomerId: data.stripe_customer_id || undefined,
      stripeSubscriptionId: data.stripe_subscription_id || undefined,
      trialEndsAt: data.trial_ends_at || undefined,
    };

    setSubscription(normalized);
  }, [data, setSubscription]);

  return {
    subscription: subscription || null,
    planLimits,
    isLoading,
    canUseFeature,
    isWithinLimit,
    getRemainingLimit,
    isTrialing,
    isActive,
    needsPayment,
    plan: subscription?.plan || data?.plan || 'FREE',
    status: subscription?.status || data?.status || 'TRIAL',
  };
}
