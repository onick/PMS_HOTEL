import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

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
  onSuccess,
}: PaymentDialogProps) {
  const formattedAmount = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: currency || "DOP",
  }).format(amount / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>

        <div className="text-center py-6 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
            <DollarSign className="h-8 w-8 text-success" />
          </div>
          <div>
            <p className="text-3xl font-bold">{formattedAmount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Utiliza el módulo de Billing para procesar pagos mediante efectivo, tarjeta o transferencia.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-success hover:bg-success/90"
            onClick={() => {
              onSuccess();
              onOpenChange(false);
            }}
          >
            Ir a Billing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
