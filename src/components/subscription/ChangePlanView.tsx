import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/store/subscriptionStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ChangePlanViewProps {
  hotelId: string;
  onBack?: () => void;
}

const PLAN_DETAILS = {
  FREE: { name: 'Prueba Gratis', price: 0, description: 'Prueba 30 días sin costo', gradient: 'from-gray-500 to-gray-600', trial: true },
  BASIC: { name: 'Basic', price: 29, description: 'Perfecto para hoteles pequeños', gradient: 'from-blue-500 to-blue-600' },
  PRO: { name: 'Pro', price: 79, description: 'Para hoteles en crecimiento', gradient: 'from-purple-500 to-purple-600', popular: true },
  ENTERPRISE: { name: 'Enterprise', price: 199, description: 'Para cadenas hoteleras', gradient: 'from-orange-500 to-red-600' },
};

export function ChangePlanView({ hotelId, onBack }: ChangePlanViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { plan: currentPlan } = useSubscription(hotelId);

  const changePlanMutation = useMutation({
    mutationFn: (plan: PlanType) => api.changeSubscriptionPlan(plan),
    onSuccess: () => {
      toast.success('Plan actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['subscription', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      onBack?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo actualizar el plan');
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={onBack || (() => navigate(-1))} className="mb-4">
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

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {(Object.keys(PLAN_DETAILS) as PlanType[]).map((planKey) => {
            const planInfo = PLAN_DETAILS[planKey];
            const limits = PLAN_LIMITS[planKey];
            const isCurrent = currentPlan === planKey;

            return (
              <Card key={planKey} className={`relative overflow-hidden ${isCurrent ? 'ring-2 ring-primary' : ''} ${planInfo.popular ? 'md:scale-105 shadow-xl' : ''}`}>
                <CardHeader className={`bg-gradient-to-br ${planInfo.gradient} text-white pb-8`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{planInfo.name}</h3>
                      <p className="text-white/90 text-sm mt-1">{planInfo.description}</p>
                    </div>
                    {isCurrent && <Badge className="bg-white text-primary">Plan Actual</Badge>}
                  </div>
                  <div className="mt-6">
                    {planInfo.trial ? (
                      <>
                        <div className="flex items-baseline gap-1"><span className="text-5xl font-bold">Gratis</span></div>
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
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Habitaciones</p>
                        <p className="text-sm text-muted-foreground">{limits.maxRooms === -1 ? 'Ilimitadas' : `Hasta ${limits.maxRooms}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Usuarios</p>
                        <p className="text-sm text-muted-foreground">{limits.maxUsers === -1 ? 'Ilimitados' : `Hasta ${limits.maxUsers}`}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Reservas mensuales</p>
                        <p className="text-sm text-muted-foreground">{limits.maxReservationsPerMonth === -1 ? 'Ilimitadas' : `${limits.maxReservationsPerMonth}`}</p>
                      </div>
                    </div>
                    {limits.hasChannelManager && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div><p className="font-medium">Channel Manager</p></div>
                      </div>
                    )}
                  </div>
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button disabled className="w-full" size="lg">Plan Actual</Button>
                    ) : planKey === 'FREE' ? (
                      <Button disabled className="w-full" size="lg" variant="outline">Solo para nuevos usuarios</Button>
                    ) : (
                      <Button
                        onClick={() => changePlanMutation.mutate(planKey)}
                        disabled={changePlanMutation.isPending}
                        className="w-full"
                        size="lg"
                        variant={planInfo.popular ? 'default' : 'outline'}
                      >
                        Seleccionar
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
