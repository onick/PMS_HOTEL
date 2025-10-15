import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, DollarSign, Building2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethodsProps {
  folio: any;
  onPaymentComplete: () => void;
}

export default function PaymentMethods({ folio, onPaymentComplete }: PaymentMethodsProps) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");

  const paymentMethods = [
    { id: "cash", name: "Efectivo", icon: Banknote },
    { id: "card", name: "Tarjeta de Crédito/Débito", icon: CreditCard },
    { id: "transfer", name: "Transferencia Bancaria", icon: Building2 },
    { id: "stripe", name: "Stripe (Online)", icon: DollarSign },
  ];

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Monto inválido");
      }

      const amountCents = Math.round(paymentAmount * 100);

      if (amountCents > folio.balance_cents) {
        throw new Error("El monto excede el balance pendiente");
      }

      // Registrar el pago como cargo negativo
      const { error: chargeError } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: folio.id,
          description: `Pago - ${paymentMethods.find(p => p.id === paymentMethod)?.name}${transactionId ? ` - Ref: ${transactionId}` : ""}`,
          amount_cents: -amountCents,
        });

      if (chargeError) throw chargeError;

      // Actualizar balance del folio
      const newBalance = folio.balance_cents - amountCents;
      const { error: folioError } = await supabase
        .from("folios")
        .update({ balance_cents: Math.max(0, newBalance) })
        .eq("id", folio.id);

      if (folioError) throw folioError;

      return { newBalance };
    },
    onSuccess: (data) => {
      toast.success("Pago procesado correctamente");
      setAmount("");
      setPaymentMethod("");
      setTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["folio-charges"] });
      queryClient.invalidateQueries({ queryKey: ["active-folios"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
      if (data.newBalance === 0) {
        onPaymentComplete();
      }
    },
    onError: (error: any) => {
      toast.error("Error al procesar pago: " + error.message);
    },
  });

  const handleProcessPayment = () => {
    if (!paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    if (!amount) {
      toast.error("Ingresa el monto a pagar");
      return;
    }

    processPaymentMutation.mutate();
  };

  const balance = folio.balance_cents / 100;

  return (
    <Card className="border-success/20 bg-success/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <DollarSign className="h-5 w-5" />
          Procesar Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Método de Pago</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona método de pago" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {method.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Monto ({folio.currency})</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            max={balance}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Balance pendiente: ${balance.toFixed(2)}
          </p>
        </div>

        {paymentMethod && paymentMethod !== "cash" && (
          <div>
            <Label>Referencia/ID de Transacción (opcional)</Label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Ej: TXN-12345"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => setAmount(balance.toFixed(2))}
            variant="outline"
            size="sm"
          >
            Pago Total
          </Button>
          <Button
            onClick={() => setAmount((balance / 2).toFixed(2))}
            variant="outline"
            size="sm"
          >
            50%
          </Button>
        </div>

        <Button
          onClick={handleProcessPayment}
          disabled={processPaymentMutation.isPending || !paymentMethod || !amount}
          className="w-full bg-success hover:bg-success/90"
          size="lg"
        >
          {processPaymentMutation.isPending ? "Procesando..." : "Confirmar Pago"}
        </Button>
      </CardContent>
    </Card>
  );
}
