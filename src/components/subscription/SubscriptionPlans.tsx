import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/store/subscriptionStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Sparkles, Shield, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { SubscriptionStatusAlert } from './SubscriptionStatusAlert';

interface SubscriptionPlansProps {
  hotelId: string;
}

const PLAN_INFO = {
  FREE: {
    name: 'Free',
    price: 0,
    icon: Shield,
    color: 'text-muted-foreground',
    description: 'Perfecto para empezar',
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    icon: Zap,
    color: 'text-primary',
    description: 'Para hoteles pequeños',
    popular: false,
  },
  PRO: {
    name: 'Pro',
    price: 79,
    icon: Sparkles,
    color: 'text-success',
    description: 'Para hoteles en crecimiento',
    popular: true,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    icon: Crown,
    color: 'text-warning',
    description: 'Para cadenas hoteleras',
    popular: false,
  },
};

export function SubscriptionPlans({ hotelId }: SubscriptionPlansProps) {
  const { subscription, plan: currentPlan, isLoading } = useSubscription(hotelId);
  const [upgradingToPlan, setUpgradingToPlan] = useState<PlanType | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === 'FREE') {
      toast.error('No puedes cambiar al plan gratuito directamente');
      return;
    }

    setUpgradingToPlan(plan);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No estás autenticado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan, hotelId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear checkout');
      }

      const data = await response.json();

      // If subscription was updated directly (no checkout needed)
      if (data.message && data.redirect) {
        toast.success('¡Plan actualizado exitosamente!');
        // Refresh subscription data
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1000);
      } else if (data.url) {
        // Redirect to Stripe Checkout for new subscription
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast.error(error.message || 'Error al actualizar el plan');
      setUpgradingToPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No estás autenticado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ hotelId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al abrir portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Error al abrir el portal de cliente');
    }
  };

  if (isLoading) {
    return <div>Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {subscription && (
        <SubscriptionStatusAlert subscription={subscription} hotelId={hotelId} />
      )}

      {/* Current Plan Info */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Actual</CardTitle>
            <CardDescription>
              Tu suscripción actual y estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">{PLAN_INFO[currentPlan as PlanType]?.name || currentPlan}</h3>
                  <SubscriptionStatusBadge subscription={subscription} />
                </div>
                <p className="text-muted-foreground">
                  {subscription.status === 'TRIAL'
                    ? `Trial hasta ${new Date(subscription.trialEndsAt!).toLocaleDateString()}`
                    : `Renovación: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              </div>
              <Button onClick={handleManageSubscription} variant="outline">
                Gestionar Suscripción
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(PLAN_INFO) as PlanType[]).map((planKey) => {
          const planInfo = PLAN_INFO[planKey];
          const limits = PLAN_LIMITS[planKey];
          const Icon = planInfo.icon;
          const isCurrent = currentPlan === planKey;

          return (
            <Card 
              key={planKey}
              className={`relative ${
                planInfo.popular ? 'border-primary shadow-lg' : ''
              } ${isCurrent ? 'border-2 border-primary' : ''}`}
            >
              {planInfo.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Más Popular</Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-6 w-6 ${planInfo.color}`} />
                  <CardTitle>{planInfo.name}</CardTitle>
                </div>
                <CardDescription>{planInfo.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${planInfo.price}
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>
                      {limits.maxRooms === -1 ? 'Habitaciones ilimitadas' : `Hasta ${limits.maxRooms} habitaciones`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>
                      {limits.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${limits.maxUsers} usuarios`}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>
                      {limits.maxReservationsPerMonth === -1 
                        ? 'Reservas ilimitadas' 
                        : `${limits.maxReservationsPerMonth} reservas/mes`}
                    </span>
                  </li>
                  {limits.hasChannelManager && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>Channel Manager</span>
                    </li>
                  )}
                  {limits.hasAdvancedReports && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>Reportes avanzados</span>
                    </li>
                  )}
                  {limits.hasPrioritySupport && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>Soporte prioritario</span>
                    </li>
                  )}
                  {limits.hasAPI && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>Acceso API</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button disabled className="w-full">
                    Plan Actual
                  </Button>
                ) : planKey === 'FREE' ? (
                  <Button disabled variant="outline" className="w-full">
                    Plan Gratuito
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={upgradingToPlan !== null}
                    className="w-full"
                  >
                    {upgradingToPlan === planKey ? 'Procesando...' : 'Actualizar Plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
