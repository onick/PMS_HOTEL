import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import PaymentMethods from "./PaymentMethods";
import InvoiceActions from "./InvoiceActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";

interface FolioDetailsProps {
  folio: any;
  open: boolean;
  onClose: () => void;
}

const CHARGE_CATEGORIES = [
  { value: "ROOM", label: "Habitación" },
  { value: "FOOD", label: "Alimentos" },
  { value: "BEVERAGE", label: "Bebidas" },
  { value: "MINIBAR", label: "Minibar" },
  { value: "LAUNDRY", label: "Lavandería" },
  { value: "SPA", label: "Spa" },
  { value: "PARKING", label: "Estacionamiento" },
  { value: "OTHER", label: "Otro" },
];

const categoryConfig: Record<string, { label: string; color: string }> = {
  ROOM: { label: "Habitación", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  FOOD: { label: "Alimentos", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  BEVERAGE: { label: "Bebidas", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  MINIBAR: { label: "Minibar", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  LAUNDRY: { label: "Lavandería", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  SPA: { label: "Spa", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  PARKING: { label: "Estacionamiento", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  OTHER: { label: "Otro", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

export default function FolioDetails({ folio, open, onClose }: FolioDetailsProps) {
  const queryClient = useQueryClient();
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeCategory, setChargeCategory] = useState("OTHER");
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeQuantity, setChargeQuantity] = useState("1");

  // Fetch full folio details with charges from API
  const { data: folioDetails } = useQuery({
    queryKey: ["folio-details", folio?.id],
    enabled: !!folio?.id && open,
    queryFn: async () => {
      const res = await api.getFolio(folio.id);
      return res.data;
    },
  });

  const displayFolio = folioDetails || folio;
  const charges = displayFolio?.charges || [];
  const reservation = displayFolio?.reservation || folio?.reservation;

  const addChargeMutation = useMutation({
    mutationFn: async (data: { category: string; description: string; amount_cents: number }) => {
      return api.postCharge(folio.id, data);
    },
    onSuccess: () => {
      toast.success("Cargo aplicado correctamente");
      setChargeCategory("OTHER");
      setChargeDescription("");
      setChargeAmount("");
      setChargeQuantity("1");
      setShowAddCharge(false);
      queryClient.invalidateQueries({ queryKey: ["folio-details", folio.id] });
      queryClient.invalidateQueries({ queryKey: ["active-folios"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al aplicar cargo");
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
    });
  };

  if (!folio) return null;

  const guestName = reservation?.guest?.full_name || "Huésped";
  const roomTypeName = reservation?.units?.[0]?.room_type?.name;
  const balance = displayFolio.balance_cents / 100;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: displayFolio.currency || "DOP",
    }).format(cents / 100);
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

        {/* Guest info */}
        <div className="space-y-2">
          <h3 className="font-semibold">Huésped</h3>
          <p className="text-lg">{guestName}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {roomTypeName && <span>{roomTypeName}</span>}
            <span>
              {formatDate(reservation?.check_in_date)} - {formatDate(reservation?.check_out_date)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Balance */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="font-semibold">Balance Pendiente</span>
          <div className="text-right">
            <div className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(displayFolio.balance_cents)}
            </div>
            <p className="text-xs text-muted-foreground">{displayFolio.currency}</p>
          </div>
        </div>

        {/* Actions */}
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

          <InvoiceActions folio={displayFolio} charges={charges} />
        </div>

        {/* Add charge form */}
        {showAddCharge && (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-semibold">Nuevo Cargo</h4>
            <div>
              <Label>Categoría</Label>
              <Select value={chargeCategory} onValueChange={setChargeCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label>Precio Unitario ({displayFolio.currency})</Label>
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
                Total: {formatCurrency(Math.round(parseFloat(chargeAmount) * parseInt(chargeQuantity) * 100))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleAddCharge}
                disabled={addChargeMutation.isPending}
              >
                {addChargeMutation.isPending ? "Aplicando..." : "Aplicar Cargo"}
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

        {/* Payment methods */}
        {!showAddCharge && balance > 0 && (
          <PaymentMethods folio={displayFolio} onPaymentComplete={onClose} />
        )}

        <Separator />

        {/* Charges list */}
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
                const category = charge.category || "OTHER";
                const catInfo = categoryConfig[category] || categoryConfig.OTHER;

                return (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!isPayment && (
                          <Badge className={`text-xs ${catInfo.color}`}>
                            {catInfo.label}
                          </Badge>
                        )}
                        {isPayment && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Pago
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{charge.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(charge.charge_date || charge.created_at)}
                      </p>
                    </div>
                    <div className={`font-semibold ${isPayment ? "text-green-600" : "text-foreground"}`}>
                      {isPayment ? "-" : "+"}
                      {formatCurrency(Math.abs(charge.amount_cents))}
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
