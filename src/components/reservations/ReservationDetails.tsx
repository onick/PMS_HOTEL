import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Banknote,
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DialogContent as SecondaryDialogContent,
  DialogHeader as SecondaryDialogHeader,
  DialogTitle as SecondaryDialogTitle,
  DialogDescription as SecondaryDialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/components/payments/PaymentDialog";

interface ReservationDetailsProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function ReservationDetails({
  reservation,
  open,
  onOpenChange,
  onUpdate,
}: ReservationDetailsProps) {
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  const [paymentReference, setPaymentReference] = useState("");

  if (!reservation) return null;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: reservation.currency || "DOP",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      CONFIRMED: "bg-success/10 text-success border-success/20",
      PENDING_PAYMENT: "bg-warning/10 text-warning border-warning/20",
      CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const labels = {
      CONFIRMED: "Confirmada",
      PENDING_PAYMENT: "Pendiente de Pago",
      CANCELLED: "Cancelada",
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handlePaymentMethodSelection = () => {
    if (paymentMethod === "stripe") {
      setShowPaymentMethodDialog(false);
      setShowPaymentDialog(true);
    } else {
      handleManualPayment();
    }
  };

  const handleManualPayment = async () => {
    setConfirmingPayment(true);
    try {
      // Crear cargo en el folio
      const { error: chargeError } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: reservation.folio_id,
          description: `Pago de reserva - ${paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}${paymentReference ? ` - Ref: ${paymentReference}` : ""}`,
          amount_cents: -reservation.total_amount_cents,
        });

      if (chargeError) {
        console.error("Error creating folio charge:", chargeError);
        throw new Error(`Error al crear cargo: ${chargeError.message}${chargeError.hint ? ` - ${chargeError.hint}` : ''}`);
      }

      // Actualizar estado de reserva a CONFIRMED
      const { error: resError } = await supabase
        .from("reservations")
        .update({
          status: "CONFIRMED",
          metadata: {
            ...(reservation.metadata || {}),
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            paid_at: new Date().toISOString()
          }
        })
        .eq("id", reservation.id);

      if (resError) {
        console.error("Error updating reservation:", resError);
        throw new Error(`Error al confirmar reserva: ${resError.message}${resError.hint ? ` - ${resError.hint}` : ''}`);
      }

      toast.success("Pago registrado y reserva confirmada exitosamente");
      setShowPaymentMethodDialog(false);
      setPaymentReference("");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Manual payment error details:", error);
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Update reservation status to CONFIRMED
      const { error } = await supabase
        .from("reservations")
        .update({ status: "CONFIRMED" })
        .eq("id", reservation.id);

      if (error) throw error;

      toast.success("Pago procesado y reserva confirmada exitosamente");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Error al confirmar el pago");
    }
  };

  const handleCancelReservation = async () => {
    setCancelling(true);
    try {
      // Actualizar estado a cancelado
      const { error } = await supabase
        .from("reservations")
        .update({ status: "CANCELLED" })
        .eq("id", reservation.id);

      if (error) throw error;

      toast.success("Reserva cancelada exitosamente");
      onUpdate();
      onOpenChange(false);
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast.error("Error al cancelar la reserva");
    } finally {
      setCancelling(false);
    }
  };

  const nights = Math.ceil(
    (new Date(reservation.check_out).getTime() -
      new Date(reservation.check_in).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">Detalles de Reserva</DialogTitle>
                <DialogDescription>ID: {reservation.id.slice(0, 8)}</DialogDescription>
              </div>
              {getStatusBadge(reservation.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información del huésped */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Información del Huésped
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{reservation.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{reservation.customer.email}</span>
                </div>
                {reservation.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Información de la reserva */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Fechas de Estadía
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check-in:</span>
                    <span className="font-medium">{formatDate(reservation.check_in)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{formatDate(reservation.check_out)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Noches:</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Detalles de Habitación
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{reservation.room_types?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Huéspedes:</span>
                    <span className="font-medium">{reservation.guests}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información de pago */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Información de Pago
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(reservation.total_amount_cents)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moneda:</span>
                  <span>{reservation.currency}</span>
                </div>
                {reservation.hold_expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hold expira:</span>
                    <span className="text-warning">
                      {formatDate(reservation.hold_expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Información adicional */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Información Adicional
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creada:</span>
                  <span>{formatDate(reservation.created_at)}</span>
                </div>
                {reservation.updated_at !== reservation.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actualizada:</span>
                    <span>{formatDate(reservation.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-4">
              {reservation.status === "PENDING_PAYMENT" && (
                <Button
                  onClick={() => setShowPaymentMethodDialog(true)}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Procesar Pago
                </Button>
              )}

              {reservation.status !== "CANCELLED" && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelling}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Reserva
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la reserva y liberará el inventario. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <SecondaryDialogContent>
          <SecondaryDialogHeader>
            <SecondaryDialogTitle>Seleccionar Método de Pago</SecondaryDialogTitle>
            <SecondaryDialogDescription>
              Total a pagar: <span className="font-bold text-lg">{formatCurrency(reservation.total_amount_cents)}</span>
            </SecondaryDialogDescription>
          </SecondaryDialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-semibold">Efectivo</div>
                        <div className="text-sm text-muted-foreground">Pago en efectivo en recepción</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Tarjeta (Terminal física)</div>
                        <div className="text-sm text-muted-foreground">Pago con tarjeta en terminal</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-semibold">Stripe (Online)</div>
                        <div className="text-sm text-muted-foreground">Pago seguro online con tarjeta</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {paymentMethod !== "stripe" && (
              <div className="space-y-2">
                <Label htmlFor="reference">Referencia de Transacción (opcional)</Label>
                <Input
                  id="reference"
                  placeholder="Ej: Recibo #12345, Autorización 678901"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentMethodDialog(false);
                setPaymentReference("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePaymentMethodSelection}
              disabled={confirmingPayment}
              className="bg-success hover:bg-success/90"
            >
              {confirmingPayment ? "Procesando..." : paymentMethod === "stripe" ? "Ir a Pago Online" : "Confirmar Pago"}
            </Button>
          </div>
        </SecondaryDialogContent>
      </Dialog>

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        amount={reservation.total_amount_cents}
        currency={reservation.currency}
        reservationId={reservation.id}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
