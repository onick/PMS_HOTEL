import { Subscription } from '@/store/subscriptionStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, XCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionStatusAlertProps {
  subscription: Subscription;
  hotelId: string;
}

export function SubscriptionStatusAlert({ subscription, hotelId }: SubscriptionStatusAlertProps) {
  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  // Only show alerts for states that need user attention
  switch (subscription.status) {
    case 'TRIAL': {
      const daysLeft = subscription.trialEndsAt 
        ? getDaysRemaining(subscription.trialEndsAt)
        : 0;
      
      // Only show if less than 7 days remaining
      if (daysLeft > 7) return null;

      return (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <AlertTitle>Trial finaliza pronto</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Tu período de prueba termina en {daysLeft} día{daysLeft !== 1 ? 's' : ''}.
              Agrega un método de pago para continuar sin interrupciones.
            </span>
            <Button onClick={handleManageSubscription} size="sm" className="ml-4">
              Agregar pago
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    case 'PAST_DUE':
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema con tu pago</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              No pudimos procesar tu pago. Actualiza tu método de pago para evitar la suspensión de tu cuenta.
            </span>
            <Button 
              onClick={handleManageSubscription} 
              size="sm" 
              variant="destructive"
              className="ml-4"
            >
              Actualizar pago
            </Button>
          </AlertDescription>
        </Alert>
      );

    case 'CANCELED': {
      if (!subscription.cancelAtPeriodEnd) return null;

      const daysLeft = getDaysRemaining(subscription.currentPeriodEnd);
      
      return (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <XCircle className="h-4 w-4 text-orange-500" />
          <AlertTitle>Suscripción cancelada</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Tu plan finalizará el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              {daysLeft > 0 && ` (en ${daysLeft} día${daysLeft !== 1 ? 's' : ''})`}.
              Puedes reactivarlo en cualquier momento.
            </span>
            <Button 
              onClick={handleManageSubscription} 
              size="sm" 
              variant="outline"
              className="ml-4"
            >
              Reactivar
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
      return (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <Clock className="h-4 w-4 text-orange-500" />
          <AlertTitle>Pago pendiente</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Tu suscripción está pendiente de completar el pago. 
              Completa el proceso para activar tu plan.
            </span>
            <Button 
              onClick={handleManageSubscription} 
              size="sm"
              className="ml-4"
            >
              Completar pago
            </Button>
          </AlertDescription>
        </Alert>
      );

    default:
      return null;
  }
}
