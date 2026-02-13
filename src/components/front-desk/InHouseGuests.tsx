import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Hotel,
  User,
  Calendar,
  Mail,
  Phone,
  Home,
  Clock,
  DollarSign,
  LogOut,
  Receipt,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { GuestListItem } from "./common/GuestListItem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import FolioDetails from "@/components/billing/FolioDetails";

export default function InHouseGuests() {
  const queryClient = useQueryClient();
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showFolioDialog, setShowFolioDialog] = useState(false);

  const { data: inHouseRes } = useQuery({
    queryKey: ["in-house-guests"],
    queryFn: () => api.getInHouseGuests(),
  });

  const inHouse = inHouseRes?.data || [];

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGuest) return;

      const folio = selectedGuest.folio;
      if (folio && folio.balance_cents > 0) {
        throw new Error(`No se puede hacer check-out. Balance pendiente de $${(folio.balance_cents / 100).toFixed(2)}`);
      }

      return api.checkOut(selectedGuest.id);
    },
    onSuccess: () => {
      toast.success("Check-out realizado exitosamente. Habitación lista para limpieza.");
      setSelectedGuest(null);
      queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
      queryClient.invalidateQueries({ queryKey: ["today-departures"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al realizar check-out");
    },
  });

  const formatCurrency = (cents: number, currency: string = "DOP") => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-front-desk">
          <Hotel className="h-5 w-5" />
          Huéspedes en Casa ({inHouse?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inHouse?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay huéspedes actualmente en el hotel
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {inHouse.map((reservation: any) => {
              const roomNumber = reservation.units?.[0]?.room?.number || "Sin asignar";
              const nightsRemaining = Math.ceil(
                (new Date(reservation.check_out_date).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
              );
              const folio = reservation.folio;
              const balance = folio ? folio.balance_cents / 100 : 0;

              return (
                <GuestListItem
                  key={reservation.id}
                  id={reservation.id}
                  guestName={reservation.guest?.full_name || `${reservation.guest?.first_name || ""} ${reservation.guest?.last_name || ""}`}
                  roomNumber={roomNumber}
                  guestsCount={reservation.total_adults + (reservation.total_children || 0)}
                  roomType={reservation.units?.[0]?.room_type?.name || "Standard"}
                  date={formatDate(reservation.check_out_date)}
                  status={reservation.status}
                  type="departure"
                  onAction={() => setSelectedGuest(reservation)}
                  actionLabel="Ver detalles"
                  secondaryAction={
                    <>
                      {balance > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1 mr-2">
                          <DollarSign className="h-3 w-3" />
                          Balance
                        </Badge>
                      )}
                      <span className={cn("text-xs font-medium mr-2", nightsRemaining <= 1 ? "text-amber-600" : "text-muted-foreground")}>
                        {nightsRemaining} {nightsRemaining === 1 ? "noche" : "noches"}
                      </span>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Guest Details Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Información del Huésped</DialogTitle>
            <DialogDescription>
              Detalles completos de la estadía actual
            </DialogDescription>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-6">
              {/* Guest Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Información Personal
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedGuest.guest?.full_name || `${selectedGuest.guest?.first_name || ""} ${selectedGuest.guest?.last_name || ""}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedGuest.guest?.email || "—"}</span>
                  </div>
                  {selectedGuest.guest?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedGuest.guest.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Stay Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Habitación
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Número:</span>
                      <span className="font-medium">
                        {selectedGuest.units?.[0]?.room?.number || "Sin asignar"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{selectedGuest.units?.[0]?.room_type?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Huéspedes:</span>
                      <span className="font-medium">{selectedGuest.total_adults + (selectedGuest.total_children || 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Fechas de Estadía
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Check-in:</span>
                      <span className="font-medium">{formatDate(selectedGuest.check_in_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Check-out:</span>
                      <span className="font-medium">{formatDate(selectedGuest.check_out_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Noches restantes:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(selectedGuest.check_out_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Folio Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Balance del Folio
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  {selectedGuest.folio ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Balance actual:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className={`font-bold text-lg ${selectedGuest.folio.balance_cents > 0 ? "text-destructive" : "text-success"}`}>
                          {formatCurrency(
                            selectedGuest.folio.balance_cents,
                            selectedGuest.currency || "DOP"
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No hay folio asociado</p>
                  )}

                  {selectedGuest.folio?.balance_cents > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-warning text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>El huésped debe saldar el balance antes de realizar check-out</p>
                    </div>
                  )}

                  {selectedGuest.folio && (
                    <Button
                      onClick={() => setShowFolioDialog(true)}
                      className="w-full mt-3"
                      variant="outline"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Gestionar Folio
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Additional Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Información Adicional
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código de Reserva:</span>
                    <span className="font-mono">{selectedGuest.confirmation_code || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in realizado:</span>
                    <span>
                      {selectedGuest.checked_in_at
                        ? formatDate(selectedGuest.checked_in_at)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total estadía:</span>
                    <span>
                      {formatCurrency(selectedGuest.total_cents, selectedGuest.currency || "DOP")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedGuest(null)}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending || (selectedGuest?.folio?.balance_cents > 0)}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {checkOutMutation.isPending ? "Procesando..." : "Realizar Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folio Management Dialog */}
      {selectedGuest?.folio && (
        <FolioDetails
          folio={selectedGuest.folio}
          open={showFolioDialog}
          onClose={() => {
            setShowFolioDialog(false);
            queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
          }}
        />
      )}
    </Card>
  );
}
