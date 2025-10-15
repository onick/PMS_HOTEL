import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, CreditCard, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";

interface FolioDetailsProps {
  folio: any;
  open: boolean;
  onClose: () => void;
}

export default function FolioDetails({ folio, open, onClose }: FolioDetailsProps) {
  const queryClient = useQueryClient();
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const { data: charges } = useQuery({
    queryKey: ["folio-charges", folio?.id],
    enabled: !!folio?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folio_charges")
        .select("*")
        .eq("folio_id", folio.id)
        .order("charge_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const addChargeMutation = useMutation({
    mutationFn: async (charge: { description: string; amount_cents: number }) => {
      const { error } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: folio.id,
          description: charge.description,
          amount_cents: charge.amount_cents,
        });

      if (error) throw error;

      // Actualizar balance del folio
      const newBalance = (folio.balance_cents || 0) + charge.amount_cents;
      const { error: updateError } = await supabase
        .from("folios")
        .update({ balance_cents: newBalance })
        .eq("id", folio.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Cargo aplicado correctamente");
      setChargeDescription("");
      setChargeAmount("");
      setShowAddCharge(false);
      queryClient.invalidateQueries({ queryKey: ["folio-charges"] });
      queryClient.invalidateQueries({ queryKey: ["active-folios"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
    },
    onError: (error: any) => {
      toast.error("Error al aplicar cargo: " + error.message);
    },
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async (amount_cents: number) => {
      // Registrar pago como cargo negativo
      const { error } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: folio.id,
          description: "Pago recibido",
          amount_cents: -amount_cents,
        });

      if (error) throw error;

      // Actualizar balance del folio
      const newBalance = (folio.balance_cents || 0) - amount_cents;
      const { error: updateError } = await supabase
        .from("folios")
        .update({ balance_cents: Math.max(0, newBalance) })
        .eq("id", folio.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Pago registrado correctamente");
      setPaymentAmount("");
      setShowPayment(false);
      queryClient.invalidateQueries({ queryKey: ["folio-charges"] });
      queryClient.invalidateQueries({ queryKey: ["active-folios"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
    },
    onError: (error: any) => {
      toast.error("Error al registrar pago: " + error.message);
    },
  });

  const handleAddCharge = () => {
    if (!chargeDescription || !chargeAmount) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    addChargeMutation.mutate({
      description: chargeDescription,
      amount_cents: Math.round(amount * 100),
    });
  };

  const handleRegisterPayment = () => {
    if (!paymentAmount) {
      toast.error("Por favor ingresa el monto del pago");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (amount * 100 > folio.balance_cents) {
      toast.error("El monto excede el balance pendiente");
      return;
    }

    registerPaymentMutation.mutate(Math.round(amount * 100));
  };

  if (!folio) return null;

  const reservation = folio.reservations?.[0];
  const balance = folio.balance_cents / 100;
  const totalCharges = charges?.reduce((sum, c) => sum + c.amount_cents, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Folio</DialogTitle>
          <DialogDescription>
            Gestión de cargos y pagos del huésped
          </DialogDescription>
        </DialogHeader>

        {/* Información del huésped */}
        <div className="space-y-2">
          <h3 className="font-semibold">Huésped</h3>
          <p className="text-lg">{reservation?.customer?.name}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{reservation?.room_types?.name}</span>
            <span>
              {formatDate(reservation?.check_in)} - {formatDate(reservation?.check_out)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Balance actual */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="font-semibold">Balance Pendiente</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-destructive">
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{folio.currency}</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddCharge(true)}
            variant="outline"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cargo
          </Button>
          <Button
            onClick={() => setShowPayment(true)}
            className="flex-1 bg-billing hover:bg-billing/90"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        {/* Formulario agregar cargo */}
        {showAddCharge && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-semibold">Nuevo Cargo</h4>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="Ej: Servicio a la habitación, Minibar, etc."
              />
            </div>
            <div>
              <Label>Monto ({folio.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddCharge}
                disabled={addChargeMutation.isPending}
              >
                Aplicar Cargo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCharge(false);
                  setChargeDescription("");
                  setChargeAmount("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Formulario registrar pago */}
        {showPayment && (
          <div className="space-y-3 p-4 border rounded-lg bg-success/5">
            <h4 className="font-semibold">Registrar Pago</h4>
            <div>
              <Label>Monto ({folio.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Balance pendiente: ${balance.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRegisterPayment}
                disabled={registerPaymentMutation.isPending}
                className="bg-success hover:bg-success/90"
              >
                Confirmar Pago
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPayment(false);
                  setPaymentAmount("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Lista de cargos */}
        <div>
          <h4 className="font-semibold mb-3">Historial de Movimientos</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {!charges?.length ? (
              <p className="text-muted-foreground text-center py-4">
                No hay movimientos registrados
              </p>
            ) : (
              charges.map((charge: any) => {
                const amount = charge.amount_cents / 100;
                const isPayment = amount < 0;

                return (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{charge.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(charge.charge_date || charge.created_at)}
                      </p>
                    </div>
                    <div className={`font-semibold ${isPayment ? "text-success" : "text-foreground"}`}>
                      {isPayment ? "-" : "+"}${Math.abs(amount).toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
