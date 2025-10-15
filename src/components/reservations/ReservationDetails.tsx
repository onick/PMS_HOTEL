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

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-payment", {
        body: {
          hotelId: reservation.hotel_id,
          reservationId: reservation.id,
          paymentIntentId: reservation.payment_intent_id || "manual-payment",
        },
      });

      if (error) throw error;

      toast.success("Pago confirmado exitosamente");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      toast.error(error.message || "Error al confirmar el pago");
    } finally {
      setConfirmingPayment(false);
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
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmingPayment ? "Procesando..." : "Confirmar Pago"}
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
    </>
  );
}
