import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanLimits } from '@/store/subscriptionStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  children: ReactNode;
  feature: keyof PlanLimits;
  hotelId?: string;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  children,
  feature,
  hotelId,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { canUseFeature, isLoading, plan } = useSubscription(hotelId);

  if (isLoading) {
    return null;
  }

  const hasAccess = canUseFeature(feature);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <Alert className="border-primary/50 bg-primary/5">
          <Lock className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Función no disponible en el plan {plan}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Actualiza tu plan para acceder a esta funcionalidad
              </p>
            </div>
            <Button asChild size="sm" className="ml-4">
              <Link to="/dashboard/settings?tab=subscription">
                <Sparkles className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}
