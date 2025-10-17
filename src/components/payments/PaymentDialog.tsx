import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckoutForm } from "./CheckoutForm";
import { stripePromise } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: string;
  reservationId?: string;
  onSuccess: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  amount,
  currency,
  reservationId,
  onSuccess,
}: PaymentDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && amount > 0) {
      createPaymentIntent();
    }
  }, [open, amount]);

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      console.log('Creating payment intent with:', { amount, currency, reservationId });

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          currency: currency.toLowerCase(),
          reservationId,
          metadata: {
            reservationId: reservationId || 'unknown',
          },
        },
      });

      console.log('Payment intent response:', { data, error });

      if (error) {
        console.error('Payment intent error:', error);
        throw error;
      }

      if (!data?.clientSecret) {
        throw new Error('No se recibió client secret del servidor');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      const errorMessage = error.message || error.toString() || 'Error desconocido al inicializar el pago';
      toast.error("Error al inicializar el pago: " + errorMessage);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setClientSecret(null);
    onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setClientSecret(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <CheckoutForm
              amount={amount}
              currency={currency}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
