import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 
  | 'TRIAL' 
  | 'ACTIVE' 
  | 'PAST_DUE' 
  | 'CANCELED' 
  | 'INCOMPLETE' 
  | 'INCOMPLETE_EXPIRED';

export interface PlanLimits {
  maxRooms: number;
  maxUsers: number;
  maxReservationsPerMonth: number;
  hasChannelManager: boolean;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasAPI: boolean;
  maxIntegrations: number;
}

export interface Subscription {
  id: string;
  hotelId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
}

interface SubscriptionState {
  // State
  subscription: Subscription | null;
  planLimits: PlanLimits | null;
  isLoading: boolean;
  
  // Actions
  setSubscription: (subscription: Subscription | null) => void;
  setPlanLimits: (limits: PlanLimits | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Getters
  canUseFeature: (feature: keyof PlanLimits) => boolean;
  isWithinLimit: (resource: 'rooms' | 'users' | 'reservations', current: number) => boolean;
  getRemainingLimit: (resource: 'rooms' | 'users' | 'reservations', current: number) => number;
  isTrialing: () => boolean;
  isActive: () => boolean;
  needsPayment: () => boolean;
}

// Plan configurations
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxRooms: 5,
    maxUsers: 2,
    maxReservationsPerMonth: 50,
    hasChannelManager: false,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
    hasCustomBranding: false,
    hasAPI: false,
    maxIntegrations: 0,
  },
  BASIC: {
    maxRooms: 20,
    maxUsers: 5,
    maxReservationsPerMonth: 200,
    hasChannelManager: true,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
    hasCustomBranding: false,
    hasAPI: false,
    maxIntegrations: 2,
  },
  PRO: {
    maxRooms: 50,
    maxUsers: 15,
    maxReservationsPerMonth: 1000,
    hasChannelManager: true,
    hasAdvancedReports: true,
    hasPrioritySupport: true,
    hasCustomBranding: true,
    hasAPI: true,
    maxIntegrations: 10,
  },
  ENTERPRISE: {
    maxRooms: -1, // unlimited
    maxUsers: -1, // unlimited
    maxReservationsPerMonth: -1, // unlimited
    hasChannelManager: true,
    hasAdvancedReports: true,
    hasPrioritySupport: true,
    hasCustomBranding: true,
    hasAPI: true,
    maxIntegrations: -1, // unlimited
  },
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: null,
      planLimits: null,
      isLoading: false,

      // Actions
      setSubscription: (subscription) => {
        set({ subscription });
        // Auto-set plan limits when subscription changes
        if (subscription) {
          set({ planLimits: PLAN_LIMITS[subscription.plan] });
        } else {
          set({ planLimits: null });
        }
      },

      setPlanLimits: (limits) => set({ planLimits: limits }),
      
      setLoading: (loading) => set({ isLoading: loading }),

      // Getters
      canUseFeature: (feature) => {
        const { planLimits } = get();
        if (!planLimits) return false;
        
        const value = planLimits[feature];
        // For boolean features
        if (typeof value === 'boolean') return value;
        // For numeric features, -1 means unlimited
        if (typeof value === 'number') return value !== 0;
        
        return false;
      },

      isWithinLimit: (resource, current) => {
        const { planLimits } = get();
        if (!planLimits) return false;

        let limit: number;
        switch (resource) {
          case 'rooms':
            limit = planLimits.maxRooms;
            break;
          case 'users':
            limit = planLimits.maxUsers;
            break;
          case 'reservations':
            limit = planLimits.maxReservationsPerMonth;
            break;
          default:
            return false;
        }

        // -1 means unlimited
        if (limit === -1) return true;
        return current < limit;
      },

      getRemainingLimit: (resource, current) => {
        const { planLimits } = get();
        if (!planLimits) return 0;

        let limit: number;
        switch (resource) {
          case 'rooms':
            limit = planLimits.maxRooms;
            break;
          case 'users':
            limit = planLimits.maxUsers;
            break;
          case 'reservations':
            limit = planLimits.maxReservationsPerMonth;
            break;
          default:
            return 0;
        }

        // -1 means unlimited
        if (limit === -1) return Infinity;
        return Math.max(0, limit - current);
      },

      isTrialing: () => {
        const { subscription } = get();
        if (!subscription) return false;
        
        if (subscription.status !== 'TRIAL') return false;
        
        if (subscription.trialEndsAt) {
          return new Date(subscription.trialEndsAt) > new Date();
        }
        
        return true;
      },

      isActive: () => {
        const { subscription } = get();
        if (!subscription) return false;
        return subscription.status === 'ACTIVE' || subscription.status === 'TRIAL';
      },

      needsPayment: () => {
        const { subscription } = get();
        if (!subscription) return true;
        return subscription.status === 'PAST_DUE' || 
               subscription.status === 'INCOMPLETE' || 
               subscription.status === 'INCOMPLETE_EXPIRED';
      },
    }),
    {
      name: 'subscription-storage', // unique name for localStorage key
      partialize: (state) => ({
        subscription: state.subscription,
        planLimits: state.planLimits,
      }),
    }
  )
);
