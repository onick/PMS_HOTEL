import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CheckoutFormProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutForm({ amount, currency, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "DOP",
    }).format(amount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/billing`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Error al procesar el pago");
      } else {
        toast.success("Pago procesado exitosamente");
        onSuccess();
      }
    } catch (err: any) {
      toast.error("Error al procesar el pago: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procesar Pago</CardTitle>
        <CardDescription>
          Total a pagar: <span className="font-bold text-lg">{formatCurrency(amount)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="bg-success hover:bg-success/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar ${formatCurrency(amount)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
