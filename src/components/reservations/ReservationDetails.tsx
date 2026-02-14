import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Clock,
  DollarSign,
  XCircle,
  Banknote,
  ArrowRight,
  Moon,
  Users,
  Hash,
  Globe,
  MessageSquare,
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { api } from "@/lib/api";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { formatCurrencyFromCents, normalizeCurrencyCode } from "@/lib/currency";

interface ReservationDetailsProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const STATUS_CONFIG: Record<string, { style: string; label: string; dot: string }> = {
  CONFIRMED: {
    style: "bg-success/10 text-success border-success/20",
    label: "Confirmada",
    dot: "bg-success",
  },
  PENDING: {
    style: "bg-warning/10 text-warning border-warning/20",
    label: "Pendiente",
    dot: "bg-warning",
  },
  CANCELLED: {
    style: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Cancelada",
    dot: "bg-destructive",
  },
  CHECKED_IN: {
    style: "bg-primary/10 text-primary border-primary/20",
    label: "Check-in",
    dot: "bg-primary",
  },
  CHECKED_OUT: {
    style: "bg-muted text-muted-foreground border-border",
    label: "Check-out",
    dot: "bg-muted-foreground",
  },
  NO_SHOW: {
    style: "bg-destructive/10 text-destructive border-destructive/20",
    label: "No Show",
    dot: "bg-destructive",
  },
};

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
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentReference, setPaymentReference] = useState("");

  if (!reservation) return null;
  const currencyCode = normalizeCurrencyCode(reservation.currency);

  const formatCurrency = (cents: number) => {
    return formatCurrencyFromCents(cents, currencyCode);
  };

  const status = STATUS_CONFIG[reservation.status] || {
    style: "bg-muted text-muted-foreground",
    label: reservation.status,
    dot: "bg-muted-foreground",
  };

  const guestName = reservation.guest?.full_name || "Sin nombre";
  const guestEmail = reservation.guest?.email;
  const guestPhone = reservation.guest?.phone;
  const roomTypeName = reservation.units?.[0]?.room_type?.name || "N/A";
  const roomNumber = reservation.units?.[0]?.room?.number;

  const nights =
    reservation.nights ||
    Math.ceil(
      (new Date(reservation.check_out_date).getTime() -
        new Date(reservation.check_in_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const handleRecordPayment = async () => {
    if (!reservation.folio?.id) {
      toast.error("No se encontró folio para esta reserva");
      return;
    }

    setConfirmingPayment(true);
    try {
      const providerMap: Record<string, string> = {
        cash: "cash",
        card: "card_terminal",
        transfer: "bank_transfer",
      };

      await api.recordPayment(reservation.folio.id, {
        provider: providerMap[paymentMethod] || paymentMethod,
        amount_cents: reservation.total_cents,
        description: `Pago de reserva #${reservation.confirmation_code}`,
        reference_number: paymentReference || undefined,
      });

      toast.success("Pago registrado exitosamente");
      setShowPaymentMethodDialog(false);
      setPaymentReference("");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCancelReservation = async () => {
    setCancelling(true);
    try {
      await api.cancelReservation(reservation.id);
      toast.success("Reserva cancelada exitosamente");
      onUpdate();
      onOpenChange(false);
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast.error(error.message || "Error al cancelar la reserva");
    } finally {
      setCancelling(false);
    }
  };

  const balanceCents = reservation.folio?.balance_cents ?? 0;
  const isPaid = balanceCents === 0 && reservation.folio;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Hero header — guest name, status, confirmation code */}
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold truncate">
                    {guestName}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    {reservation.confirmation_code && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        #{reservation.confirmation_code}
                      </span>
                    )}
                    {reservation.source && (
                      <span className="flex items-center gap-1 text-xs">
                        <Globe className="h-3 w-3" />
                        {reservation.source}
                      </span>
                    )}
                  </DialogDescription>
                </div>
                <Badge className={`${status.style} shrink-0`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot} mr-1.5`} />
                  {status.label}
                </Badge>
              </div>
            </DialogHeader>

            {/* Stay visual — check-in → nights → check-out */}
            <div className="mt-5 flex items-center gap-3 rounded-lg border p-4">
              <div className="flex-1 text-center">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Check-in
                </p>
                <p className="font-semibold text-sm">{formatDate(reservation.check_in_date)}</p>
              </div>
              <div className="flex flex-col items-center gap-1 px-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="h-px w-6 bg-border" />
                  <Moon className="h-3.5 w-3.5 text-primary" />
                  <div className="h-px w-6 bg-border" />
                </div>
                <span className="text-xs font-bold text-primary">
                  {nights} {nights === 1 ? "noche" : "noches"}
                </span>
              </div>
              <div className="flex-1 text-center">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Check-out
                </p>
                <p className="font-semibold text-sm">{formatDate(reservation.check_out_date)}</p>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Habitación</span>
                </div>
                <p className="font-semibold text-sm">{roomTypeName}</p>
                {roomNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hab. {roomNumber}
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Huéspedes</span>
                </div>
                <p className="font-semibold text-sm">
                  {reservation.total_adults} adulto{reservation.total_adults !== 1 ? "s" : ""}
                </p>
                {reservation.total_children > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reservation.total_children} niño{reservation.total_children !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Total</span>
                </div>
                <p className="font-semibold text-sm">{formatCurrency(reservation.total_cents)}</p>
                <p className={`text-xs mt-0.5 font-medium ${isPaid ? "text-success" : balanceCents > 0 ? "text-warning" : "text-muted-foreground"}`}>
                  {isPaid ? "Pagado" : balanceCents > 0 ? `Pendiente: ${formatCurrency(balanceCents)}` : reservation.currency}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabbed content */}
          <div className="px-6 pb-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mt-4">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="payment">Pago</TabsTrigger>
                <TabsTrigger value="info">Información</TabsTrigger>
              </TabsList>

              {/* Tab: Details — guest contact + room */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                    Contacto del huésped
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{guestName}</span>
                    </div>
                    {guestEmail && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{guestEmail}</span>
                      </div>
                    )}
                    {guestPhone && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{guestPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {reservation.special_requests && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                        Solicitudes especiales
                      </h4>
                      <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm">{reservation.special_requests}</p>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Tab: Payment — folio, balance, actions */}
              <TabsContent value="payment" className="space-y-4 mt-4">
                <div className="rounded-lg border overflow-hidden">
                  {/* Payment summary header */}
                  <div className={`px-4 py-3 ${isPaid ? "bg-success/5" : balanceCents > 0 ? "bg-warning/5" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total de la reserva</span>
                      <span className="text-lg font-bold">{formatCurrency(reservation.total_cents)}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {reservation.folio && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5" />
                            Folio
                          </span>
                          <span className="font-mono">#{reservation.folio.folio_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance pendiente</span>
                          <span className={`font-semibold ${balanceCents > 0 ? "text-warning" : "text-success"}`}>
                            {balanceCents > 0 ? formatCurrency(balanceCents) : formatCurrency(0)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moneda</span>
                      <span>{currencyCode}</span>
                    </div>
                  </div>
                </div>

                {/* Payment action */}
                {reservation.status === "PENDING" && reservation.folio?.id && (
                  <Button
                    onClick={() => setShowPaymentMethodDialog(true)}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago — {formatCurrency(reservation.total_cents)}
                  </Button>
                )}
              </TabsContent>

              {/* Tab: Info — source, dates, metadata */}
              <TabsContent value="info" className="space-y-3 mt-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge className={`${status.style} text-xs`}>
                      {status.label}
                    </Badge>
                  </div>
                  {reservation.source && (
                    <div className="flex justify-between py-1.5 border-t">
                      <span className="text-muted-foreground">Fuente</span>
                      <span className="font-medium">{reservation.source}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t">
                    <span className="text-muted-foreground">Creada</span>
                    <span>{formatDate(reservation.created_at)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t">
                    <span className="text-muted-foreground">Check-in</span>
                    <span>{formatDate(reservation.check_in_date)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t">
                    <span className="text-muted-foreground">Check-out</span>
                    <span>{formatDate(reservation.check_out_date)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t">
                    <span className="text-muted-foreground">Noches</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t">
                    <span className="text-muted-foreground">Tipo de habitación</span>
                    <span className="font-medium">{roomTypeName}</span>
                  </div>
                  {roomNumber && (
                    <div className="flex justify-between py-1.5 border-t">
                      <span className="text-muted-foreground">Habitación asignada</span>
                      <span className="font-medium">{roomNumber}</span>
                    </div>
                  )}
                  {reservation.confirmation_code && (
                    <div className="flex justify-between py-1.5 border-t">
                      <span className="text-muted-foreground">Código de confirmación</span>
                      <span className="font-mono text-xs">{reservation.confirmation_code}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions — always visible at bottom */}
            {reservation.status !== "CANCELLED" && reservation.status !== "CHECKED_OUT" && (
              <>
                <Separator className="mt-4" />
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Reserva
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la reserva de <span className="font-medium text-foreground">{guestName}</span> y
              liberará el inventario. Esta acción no se puede deshacer.
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

      {/* Payment method dialog */}
      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Reserva de {guestName}
            </DialogDescription>
          </DialogHeader>

          {/* Amount display */}
          <div className="text-center py-3">
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(reservation.total_cents)}</p>
            <p className="text-xs text-muted-foreground mt-1">{reservation.currency}</p>
          </div>

          <div className="space-y-4">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                <div
                  className={`flex items-center space-x-3 border rounded-lg p-3.5 cursor-pointer transition-colors ${
                    paymentMethod === "cash" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <RadioGroupItem value="cash" id="pay-cash" />
                  <Label htmlFor="pay-cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Efectivo</div>
                        <div className="text-xs text-muted-foreground">Pago en recepción</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-3 border rounded-lg p-3.5 cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <RadioGroupItem value="card" id="pay-card" />
                  <Label htmlFor="pay-card" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Tarjeta</div>
                        <div className="text-xs text-muted-foreground">Terminal punto de venta</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-3 border rounded-lg p-3.5 cursor-pointer transition-colors ${
                    paymentMethod === "transfer" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setPaymentMethod("transfer")}
                >
                  <RadioGroupItem value="transfer" id="pay-transfer" />
                  <Label htmlFor="pay-transfer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Transferencia</div>
                        <div className="text-xs text-muted-foreground">Transferencia bancaria</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="reference" className="text-xs text-muted-foreground">
                Referencia (opcional)
              </Label>
              <Input
                id="reference"
                placeholder="Ej: Recibo #12345, Autorización 678901"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentMethodDialog(false);
                setPaymentReference("");
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={confirmingPayment}
              className="flex-1 bg-success hover:bg-success/90"
            >
              {confirmingPayment ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
