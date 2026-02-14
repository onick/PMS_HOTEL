import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Sparkles, Shield, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  hotelId: string;
}

type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

const PLAN_INFO: Record<PlanType, { name: string; price: number; icon: any; color: string; description: string; popular?: boolean }> = {
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
  },
};

const PLAN_LIMITS: Record<PlanType, {
  maxRooms: number; maxUsers: number; maxReservationsPerMonth: number;
  hasChannelManager: boolean; hasAdvancedReports: boolean; hasPrioritySupport: boolean; hasAPI: boolean;
}> = {
  FREE: { maxRooms: 10, maxUsers: 2, maxReservationsPerMonth: 50, hasChannelManager: false, hasAdvancedReports: false, hasPrioritySupport: false, hasAPI: false },
  BASIC: { maxRooms: 30, maxUsers: 5, maxReservationsPerMonth: 200, hasChannelManager: false, hasAdvancedReports: false, hasPrioritySupport: false, hasAPI: false },
  PRO: { maxRooms: 100, maxUsers: 15, maxReservationsPerMonth: -1, hasChannelManager: true, hasAdvancedReports: true, hasPrioritySupport: true, hasAPI: false },
  ENTERPRISE: { maxRooms: -1, maxUsers: -1, maxReservationsPerMonth: -1, hasChannelManager: true, hasAdvancedReports: true, hasPrioritySupport: true, hasAPI: true },
};

export function SubscriptionPlans({ hotelId }: SubscriptionPlansProps) {
  const queryClient = useQueryClient();
  const { plan } = useSubscription(hotelId);
  const currentPlan: PlanType = (plan as PlanType) || 'FREE';

  const changePlanMutation = useMutation({
    mutationFn: (nextPlan: PlanType) => api.changeSubscriptionPlan(nextPlan),
    onSuccess: () => {
      toast.success('Plan actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['subscription', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo actualizar el plan');
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Actual</CardTitle>
          <CardDescription>Tu suscripción actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{PLAN_INFO[currentPlan].name}</h3>
                <Badge className="bg-success text-white">Activo</Badge>
              </div>
              <p className="text-muted-foreground">
                Plan completo con todas las funcionalidades
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <span className="text-4xl font-bold">${planInfo.price}</span>
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
                  <Button disabled className="w-full">Plan Actual</Button>
                ) : planKey === 'FREE' ? (
                  <Button disabled variant="outline" className="w-full">Plan Gratuito</Button>
                ) : (
                  <Button
                    onClick={() => changePlanMutation.mutate(planKey)}
                    disabled={changePlanMutation.isPending}
                    className="w-full"
                  >
                    Actualizar Plan
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
