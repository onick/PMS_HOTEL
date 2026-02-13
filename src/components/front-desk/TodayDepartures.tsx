import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { GuestListItem } from "./common/GuestListItem";

export default function TodayDepartures() {
  const queryClient = useQueryClient();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const { data: departuresRes } = useQuery({
    queryKey: ["today-departures"],
    queryFn: () => api.getTodayDepartures(),
  });

  const departures = departuresRes?.data || [];

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReservation) return;

      const balance = selectedReservation.folio?.balance_cents || 0;
      if (balance > 0) {
        throw new Error(`No se puede hacer check-out con balance pendiente de $${(balance / 100).toFixed(2)}`);
      }

      return api.checkOut(selectedReservation.id);
    },
    onSuccess: () => {
      toast.success("Check-out realizado exitosamente. Habitación lista para limpieza.");
      setSelectedReservation(null);
      queryClient.invalidateQueries({ queryKey: ["today-departures"] });
      queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al realizar check-out");
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-front-desk">
            <LogOut className="h-5 w-5" />
            Salidas de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!departures?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No hay salidas programadas para hoy
            </p>
          ) : (
            <div className="space-y-3">
              {departures.map((reservation: any) => {
                const balance = reservation.folio?.balance_cents || 0;
                const hasBalance = balance > 0;
                const roomNumber = reservation.units?.[0]?.room?.number;

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
                    onAction={() => setSelectedReservation(reservation)}
                    actionLabel="Check-out"
                    secondaryAction={hasBalance && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Balance pendiente
                      </Badge>
                    )}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Check-out</DialogTitle>
            <DialogDescription>
              Confirma la salida del huésped
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Huésped</p>
                <p className="text-lg">
                  {selectedReservation.guest?.full_name || `${selectedReservation.guest?.first_name || ""} ${selectedReservation.guest?.last_name || ""}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Habitación</p>
                <p>{selectedReservation.units?.[0]?.room?.number || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Balance</p>
                <p className={selectedReservation.folio?.balance_cents > 0 ? "text-destructive font-semibold" : "text-success"}>
                  {selectedReservation.folio?.balance_cents > 0
                    ? `Pendiente: $${(selectedReservation.folio.balance_cents / 100).toFixed(2)}`
                    : "Cuenta saldada"
                  }
                </p>
              </div>

              {selectedReservation.folio?.balance_cents > 0 && (
                <div className="p-3 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    El huésped tiene un balance pendiente. Asegúrate de resolver el pago antes de completar el check-out.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReservation(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending}
              className="bg-front-desk hover:bg-front-desk/90"
            >
              {checkOutMutation.isPending ? "Procesando..." : "Confirmar Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
