import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, ChevronRight, Shield, Sparkles, Crown, Zap, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MembershipOverviewProps {
  hotelId: string;
  onChangePlan?: () => void;
}

const PLAN_INFO = {
  FREE: { name: 'Plan Gratuito', icon: Shield, color: 'text-muted-foreground' },
  BASIC: { name: 'Basic', icon: Zap, color: 'text-primary' },
  PRO: { name: 'Pro', icon: Sparkles, color: 'text-success' },
  ENTERPRISE: { name: 'Enterprise', icon: Crown, color: 'text-warning' },
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  TRIAL: { label: 'Período de Prueba', variant: 'default' },
  ACTIVE: { label: 'Activo', variant: 'default' },
  PAST_DUE: { label: 'Pago Vencido', variant: 'destructive' },
  CANCELED: { label: 'Cancelado', variant: 'secondary' },
  INCOMPLETE: { label: 'Incompleto', variant: 'secondary' },
  INCOMPLETE_EXPIRED: { label: 'Expirado', variant: 'destructive' },
};

export function MembershipOverview({ hotelId, onChangePlan }: MembershipOverviewProps) {
  const navigate = useNavigate();
  const { subscription, plan: currentPlan, isLoading } = useSubscription(hotelId);

  const handleManagePaymentMethod = () => {
    toast.info('Gestión de pagos próximamente disponible');
  };

  const handleChangePlan = () => {
    if (onChangePlan) {
      onChangePlan();
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Cargando membresía...</div>;
  }

  if (!subscription) {
    return null;
  }

  const planInfo = PLAN_INFO[currentPlan as keyof typeof PLAN_INFO] || PLAN_INFO.FREE;
  const PlanIcon = planInfo.icon;
  const statusInfo = STATUS_BADGE[subscription.status as keyof typeof STATUS_BADGE];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ← Volver al Dashboard
        </Button>
      </div>

      <h1 className="text-3xl font-bold">Cuenta</h1>
      <p className="text-muted-foreground">Detalles de Membresía</p>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Badge className="mb-2" variant={statusInfo?.variant || 'default'}>
                Miembro activo
              </Badge>
              <div className="flex items-center gap-3">
                <PlanIcon className={`h-8 w-8 ${planInfo.color}`} />
                <div>
                  <h2 className="text-2xl font-bold">{planInfo.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Plan completo con todas las funcionalidades
                  </p>
                </div>
              </div>
            </div>
            {statusInfo && (
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            )}
          </div>

          <Separator className="my-6" />

          <p className="text-sm text-muted-foreground">
            Gestión de pagos y suscripciones próximamente disponible
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Enlaces Rápidos</h2>
        <div className="space-y-2">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardContent className="p-4" onClick={handleChangePlan}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Cambiar plan</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardContent className="p-4" onClick={handleManagePaymentMethod}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Gestionar método de pago</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardContent className="p-4" onClick={handleManagePaymentMethod}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Historial de facturación</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
