import { Subscription } from '@/store/subscriptionStore';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock, Sparkles } from 'lucide-react';

interface SubscriptionStatusBadgeProps {
  subscription: Subscription;
}

export function SubscriptionStatusBadge({ subscription }: SubscriptionStatusBadgeProps) {
  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = () => {
    switch (subscription.status) {
      case 'TRIAL':
        const daysLeft = subscription.trialEndsAt 
          ? getDaysRemaining(subscription.trialEndsAt)
          : 0;
        return {
          variant: 'default' as const,
          icon: Sparkles,
          text: `Trial (${daysLeft} días)`,
          className: 'bg-blue-500 hover:bg-blue-600'
        };
      
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          text: 'Activa',
          className: 'bg-green-500 hover:bg-green-600'
        };
      
      case 'PAST_DUE':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          text: 'Pago vencido',
          className: ''
        };
      
      case 'CANCELED':
        const daysUntilEnd = getDaysRemaining(subscription.currentPeriodEnd);
        return {
          variant: 'secondary' as const,
          icon: XCircle,
          text: subscription.cancelAtPeriodEnd 
            ? `Finaliza en ${daysUntilEnd} días`
            : 'Cancelada',
          className: ''
        };
      
      case 'INCOMPLETE':
      case 'INCOMPLETE_EXPIRED':
        return {
          variant: 'outline' as const,
          icon: Clock,
          text: 'Pago pendiente',
          className: 'border-orange-500 text-orange-500'
        };

      default:
        return {
          variant: 'secondary' as const,
          icon: XCircle,
          text: subscription.status,
          className: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
}
