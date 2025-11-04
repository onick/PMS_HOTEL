import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/store/subscriptionStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChangePlanViewProps {
  hotelId: string;
  onBack?: () => void;
}

const PLAN_DETAILS = {
  FREE: {
    name: 'Prueba Gratis',
    price: 0,
    description: 'Prueba 30 días sin costo',
    gradient: 'from-gray-500 to-gray-600',
    trial: true,
  },
  BASIC: {
    name: 'Basic',
    price: 29,
    description: 'Perfecto para hoteles pequeños',
    gradient: 'from-blue-500 to-blue-600',
  },
  PRO: {
    name: 'Pro',
    price: 79,
    description: 'Para hoteles en crecimiento',
    gradient: 'from-purple-500 to-purple-600',
    popular: true,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    description: 'Para cadenas hoteleras',
    gradient: 'from-orange-500 to-red-600',
  },
};

export function ChangePlanView({ hotelId, onBack }: ChangePlanViewProps) {
  const navigate = useNavigate();
  const { subscription, plan: currentPlan } = useSubscription(hotelId);
  const [changingToPlan, setChangingToPlan] = useState<PlanType | null>(null);

  const handleChangePlan = async (plan: PlanType) => {
    // FREE plan no requiere checkout
    if (plan === 'FREE') {
      toast.error('No puedes cambiar al plan gratuito directamente. Cancela tu suscripción desde el portal de cliente.');
      return;
    }

    setChangingToPlan(plan);

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

      if (data.message && data.redirect) {
        toast.success('¡Plan actualizado exitosamente!');
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1000);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Error al cambiar el plan');
      setChangingToPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack || (() => navigate(-1))}
            className="mb-4"
          >
            ← Atrás
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Cambiar Plan</h1>
            <p className="text-muted-foreground">
              Prueba un nuevo plan. Siempre puedes cambiar si no te convence.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {(Object.keys(PLAN_DETAILS) as PlanType[]).map((planKey) => {
            const planInfo = PLAN_DETAILS[planKey];
            const limits = PLAN_LIMITS[planKey];
            const isCurrent = currentPlan === planKey;

            return (
              <Card
                key={planKey}
                className={`relative overflow-hidden ${
                  isCurrent ? 'ring-2 ring-primary' : ''
                } ${planInfo.popular ? 'md:scale-105 shadow-xl' : ''}`}
              >
                {/* Gradient Header */}
                <CardHeader className={`bg-gradient-to-br ${planInfo.gradient} text-white pb-8`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{planInfo.name}</h3>
                      <p className="text-white/90 text-sm mt-1">{planInfo.description}</p>
                    </div>
                    {isCurrent && (
                      <Badge className="bg-white text-primary">
                        ✓ Plan Actual
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-6">
                    {planInfo.trial ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold">Gratis</span>
                        </div>
                        <p className="text-white/90 text-sm mt-1">30 días de prueba</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm">USD</span>
                          <span className="text-5xl font-bold">${planInfo.price}</span>
                        </div>
                        <p className="text-white/90 text-sm mt-1">Precio mensual</p>
                      </>
                    )}
                  </div>
                </CardHeader>

                {/* Features */}
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Habitaciones</p>
                        <p className="text-sm text-muted-foreground">
                          {limits.maxRooms === -1 ? 'Ilimitadas' : `Hasta ${limits.maxRooms}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Usuarios</p>
                        <p className="text-sm text-muted-foreground">
                          {limits.maxUsers === -1 ? 'Ilimitados' : `Hasta ${limits.maxUsers}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Reservas mensuales</p>
                        <p className="text-sm text-muted-foreground">
                          {limits.maxReservationsPerMonth === -1
                            ? 'Ilimitadas'
                            : `${limits.maxReservationsPerMonth}`}
                        </p>
                      </div>
                    </div>

                    {limits.hasChannelManager && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Channel Manager</p>
                          <p className="text-sm text-muted-foreground">
                            Incluido
                          </p>
                        </div>
                      </div>
                    )}

                    {limits.hasAdvancedReports && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Reportes avanzados</p>
                          <p className="text-sm text-muted-foreground">
                            Incluido
                          </p>
                        </div>
                      </div>
                    )}

                    {limits.hasPrioritySupport && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Soporte prioritario</p>
                          <p className="text-sm text-muted-foreground">
                            24/7
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button disabled className="w-full" size="lg">
                        Plan Actual
                      </Button>
                    ) : planKey === 'FREE' ? (
                      <Button
                        disabled
                        className="w-full"
                        size="lg"
                        variant="outline"
                      >
                        Solo para nuevos usuarios
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleChangePlan(planKey)}
                        disabled={changingToPlan !== null}
                        className="w-full"
                        size="lg"
                        variant={planInfo.popular ? 'default' : 'outline'}
                      >
                        {changingToPlan === planKey ? 'Procesando...' : 'Seleccionar'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
