import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/store/subscriptionStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
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
  FREE: { name: 'Free', price: 0, icon: Shield, color: 'text-muted-foreground', description: 'Perfecto para empezar' },
  BASIC: { name: 'Basic', price: 29, icon: Zap, color: 'text-primary', description: 'Para hoteles pequeños', popular: false },
  PRO: { name: 'Pro', price: 79, icon: Sparkles, color: 'text-success', description: 'Para hoteles en crecimiento', popular: true },
  ENTERPRISE: { name: 'Enterprise', price: 199, icon: Crown, color: 'text-warning', description: 'Para cadenas hoteleras', popular: false },
};

export function ChangePlanModal({ hotelId, open, onOpenChange }: ChangePlanModalProps) {
  const queryClient = useQueryClient();
  const { subscription, plan: currentPlan, isLoading } = useSubscription(hotelId);

  const changePlanMutation = useMutation({
    mutationFn: (plan: PlanType) => api.changeSubscriptionPlan(plan),
    onSuccess: () => {
      toast.success('Plan actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['subscription', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'No se pudo actualizar el plan');
    },
  });

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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {(Object.keys(PLAN_INFO) as PlanType[]).map((planKey) => {
            const planInfo = PLAN_INFO[planKey];
            const limits = PLAN_LIMITS[planKey];
            const Icon = planInfo.icon;
            const isCurrent = currentPlan === planKey;

            return (
              <Card key={planKey} className={`relative ${planInfo.popular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'border-2 border-primary' : ''}`}>
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
                    <span className="text-3xl font-bold">${planInfo.price}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <Separator />
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{limits.maxRooms === -1 ? 'Habitaciones ilimitadas' : `Hasta ${limits.maxRooms} habitaciones`}</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{limits.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${limits.maxUsers} usuarios`}</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{limits.maxReservationsPerMonth === -1 ? 'Reservas ilimitadas' : `${limits.maxReservationsPerMonth} reservas/mes`}</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button disabled className="w-full" size="sm">Plan Actual</Button>
                  ) : planKey === 'FREE' ? (
                    <Button disabled variant="outline" className="w-full" size="sm">Plan Gratuito</Button>
                  ) : (
                    <Button
                      onClick={() => changePlanMutation.mutate(planKey)}
                      disabled={changePlanMutation.isPending}
                      className="w-full"
                      size="sm"
                    >
                      Cambiar a este plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
