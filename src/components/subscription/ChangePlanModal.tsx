import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/store/subscriptionStore';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Sparkles, Shield, Zap, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

interface ChangePlanModalProps {
  hotelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ChangePlanModal({ hotelId, open, onOpenChange }: ChangePlanModalProps) {
  const { subscription, plan: currentPlan, isLoading } = useSubscription(hotelId);
  const [upgradingToPlan, setUpgradingToPlan] = useState<PlanType | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === 'FREE') {
      toast.error('No puedes cambiar al plan gratuito directamente');
      return;
    }

    if (plan === currentPlan) {
      toast.info('Ya estás en este plan');
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
        // Try to get error message from response
        let errorMessage = 'Error al crear checkout';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No se recibió URL de checkout de Stripe');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Error upgrading plan:', error);

      // More user-friendly error messages
      let userMessage = error.message || 'Error al actualizar el plan';

      if (userMessage.includes('Failed to fetch') || userMessage.includes('NetworkError')) {
        userMessage = '⚠️ Configuración de Stripe pendiente';
        toast.error(userMessage, {
          description: 'La función de pagos aún no está configurada. Contacta al administrador.',
          duration: 6000
        });
      } else {
        toast.error(userMessage);
      }

      setUpgradingToPlan(null);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cambiar Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Elige el plan que mejor se adapte a las necesidades de tu hotel
          </DialogDescription>
        </DialogHeader>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Plan Actual</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-lg font-bold">{PLAN_INFO[currentPlan as PlanType]?.name || currentPlan}</h3>
                <SubscriptionStatusBadge subscription={subscription} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                ${PLAN_INFO[currentPlan as PlanType]?.price || 0}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${planInfo.color}`} />
                    <CardTitle className="text-lg">{planInfo.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{planInfo.description}</CardDescription>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">
                      ${planInfo.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <Separator />
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>
                        {limits.maxRooms === -1 ? 'Habitaciones ilimitadas' : `Hasta ${limits.maxRooms} habitaciones`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>
                        {limits.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${limits.maxUsers} usuarios`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>
                        {limits.maxReservationsPerMonth === -1
                          ? 'Reservas ilimitadas'
                          : `${limits.maxReservationsPerMonth} reservas/mes`}
                      </span>
                    </li>
                    {limits.hasChannelManager && (
                      <li className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        <span>Channel Manager</span>
                      </li>
                    )}
                    {limits.hasAdvancedReports && (
                      <li className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        <span>Reportes avanzados</span>
                      </li>
                    )}
                    {limits.hasPrioritySupport && (
                      <li className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        <span>Soporte prioritario</span>
                      </li>
                    )}
                    {limits.hasAPI && (
                      <li className="flex items-center gap-2 text-xs">
                        <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        <span>Acceso API</span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button disabled className="w-full" size="sm">
                      Plan Actual
                    </Button>
                  ) : planKey === 'FREE' ? (
                    <Button disabled variant="outline" className="w-full" size="sm">
                      Plan Gratuito
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={upgradingToPlan !== null}
                      className="w-full"
                      size="sm"
                    >
                      {upgradingToPlan === planKey ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Cambiar a este plan'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Los cambios de plan se aplicarán inmediatamente. Se te cobrará de forma proporcional.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
