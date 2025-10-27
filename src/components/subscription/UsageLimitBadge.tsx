import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UsageLimitBadgeProps {
  resource: 'rooms' | 'users' | 'reservations';
  currentUsage: number;
  hotelId?: string;
}

export function UsageLimitBadge({ resource, currentUsage, hotelId }: UsageLimitBadgeProps) {
  const { isWithinLimit, getRemainingLimit, planLimits, plan } = useSubscription(hotelId);

  if (!planLimits) return null;

  const withinLimit = isWithinLimit(resource, currentUsage);
  const remaining = getRemainingLimit(resource, currentUsage);

  const isUnlimited = remaining === Infinity;
  const isNearLimit = !isUnlimited && remaining <= 5 && remaining > 0;
  const isAtLimit = !isUnlimited && !withinLimit;

  const getVariant = () => {
    if (isAtLimit) return 'destructive';
    if (isNearLimit) return 'warning';
    return 'secondary';
  };

  const getMessage = () => {
    if (isUnlimited) return `Uso ilimitado en plan ${plan}`;
    if (isAtLimit) return `Límite alcanzado (${currentUsage} de ${currentUsage})`;
    return `${currentUsage} de ${currentUsage + remaining} usados`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className="gap-1">
            {isAtLimit && <AlertCircle className="h-3 w-3" />}
            {isUnlimited ? '∞' : `${currentUsage}/${currentUsage + remaining}`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getMessage()}</p>
          {isNearLimit && (
            <p className="text-xs text-warning mt-1">
              ¡Te quedan solo {remaining} disponibles!
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
