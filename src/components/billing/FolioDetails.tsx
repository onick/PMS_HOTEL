import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PaymentMethods from "./PaymentMethods";
import InvoiceActions from "./InvoiceActions";
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
  const [chargeCategory, setChargeCategory] = useState("OTHER");
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeQuantity, setChargeQuantity] = useState("1");
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
    mutationFn: async (charge: { category: string; description: string; amount_cents: number; quantity: number }) => {
      const { error } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: folio.id,
          charge_category: charge.category,
          description: charge.description,
          amount_cents: charge.amount_cents,
          quantity: charge.quantity,
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
      setChargeCategory("OTHER");
      setChargeDescription("");
      setChargeAmount("");
      setChargeQuantity("1");
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
    const quantity = parseInt(chargeQuantity) || 1;
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    addChargeMutation.mutate({
      category: chargeCategory,
      description: chargeDescription,
      amount_cents: Math.round(amount * quantity * 100),
      quantity: quantity,
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

  const categoryConfig: Record<string, { label: string; color: string }> = {
    ROOM: { label: "Habitación", color: "bg-blue-100 text-blue-700" },
    FOOD: { label: "Alimentos", color: "bg-orange-100 text-orange-700" },
    BEVERAGE: { label: "Bebidas", color: "bg-purple-100 text-purple-700" },
    MINIBAR: { label: "Minibar", color: "bg-pink-100 text-pink-700" },
    LAUNDRY: { label: "Lavandería", color: "bg-cyan-100 text-cyan-700" },
    SPA: { label: "Spa", color: "bg-green-100 text-green-700" },
    PARKING: { label: "Estacionamiento", color: "bg-gray-100 text-gray-700" },
    OTHER: { label: "Otro", color: "bg-yellow-100 text-yellow-700" },
  };

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
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddCharge(true)}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cargo
            </Button>
          </div>
          
          <InvoiceActions folio={folio} charges={charges || []} />
        </div>

        {/* Formulario agregar cargo */}
        {showAddCharge && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-semibold">Nuevo Cargo</h4>
            <div>
              <Label>Categoría</Label>
              <select
                value={chargeCategory}
                onChange={(e) => setChargeCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ROOM">Habitación</option>
                <option value="FOOD">Alimentos</option>
                <option value="BEVERAGE">Bebidas</option>
                <option value="MINIBAR">Minibar</option>
                <option value="LAUNDRY">Lavandería</option>
                <option value="SPA">Spa</option>
                <option value="PARKING">Estacionamiento</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="Ej: Servicio a la habitación, Coca-Cola, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Precio Unitario ({folio.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={chargeQuantity}
                  onChange={(e) => setChargeQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
            {chargeAmount && chargeQuantity && (
              <div className="text-sm text-muted-foreground">
                Total: {folio.currency} {(parseFloat(chargeAmount) * parseInt(chargeQuantity)).toFixed(2)}
              </div>
            )}
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
                  setChargeCategory("OTHER");
                  setChargeDescription("");
                  setChargeAmount("");
                  setChargeQuantity("1");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Métodos de pago modernos */}
        {!showAddCharge && balance > 0 && (
          <PaymentMethods folio={folio} onPaymentComplete={onClose} />
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
                const category = charge.charge_category || "OTHER";
                const categoryInfo = categoryConfig[category] || categoryConfig.OTHER;

                return (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!isPayment && (
                          <Badge className={`text-xs ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </Badge>
                        )}
                        {isPayment && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Pago
                          </Badge>
                        )}
                        {charge.quantity > 1 && (
                          <span className="text-xs text-muted-foreground">
                            x{charge.quantity}
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{charge.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(charge.charge_date || charge.created_at)}
                      </p>
                    </div>
                    <div className={`font-semibold ${isPayment ? "text-green-600" : "text-foreground"}`}>
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
