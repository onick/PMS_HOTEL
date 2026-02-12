import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Calendar, DollarSign } from "lucide-react";
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

export default function TodayDepartures({ hotelId }: { hotelId: string }) {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const today = new Date().toISOString().split("T")[0];

  const { data: departures, refetch } = useQuery({
    queryKey: ["today-departures", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name),
          folios (balance_cents)
        `)
        .eq("hotel_id", hotelId)
        .eq("check_out", today)
        .eq("status", "CHECKED_IN")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleCheckOut = async () => {
    if (!selectedReservation) return;

    // Verificar si hay balance pendiente
    const balance = selectedReservation.folios?.[0]?.balance_cents || 0;
    if (balance > 0) {
      toast.error(`No se puede hacer check-out con balance pendiente de RD$${(balance / 100).toFixed(2)}`);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-out`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            reservationId: selectedReservation.id,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Error al realizar check-out");
      }

      toast.success("Check-out realizado exitosamente. Habitación lista para limpieza.");
      setSelectedReservation(null);
      refetch();
    } catch (error: any) {
      console.error("Check-out error:", error);
      toast.error(error.message || "Error al realizar check-out");
    }
  };

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
                const balance = reservation.folios?.[0]?.balance_cents || 0;
                const hasBalance = balance > 0;

                return (
                  <GuestListItem
                    key={reservation.id}
                    id={reservation.id}
                    guestName={reservation.customer.name}
                    roomNumber={reservation.metadata?.room_number}
                    guestsCount={reservation.guests}
                    roomType={reservation.room_types?.name || "Standard"}
                    date={formatDate(reservation.check_out)}
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
                <p className="text-lg">{selectedReservation.customer.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Habitación</p>
                <p>{selectedReservation.metadata?.room_number || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Balance</p>
                <p className={selectedReservation.folios?.[0]?.balance_cents > 0 ? "text-destructive font-semibold" : "text-success"}>
                  {selectedReservation.folios?.[0]?.balance_cents > 0
                    ? `Pendiente: $${(selectedReservation.folios[0].balance_cents / 100).toFixed(2)}`
                    : "Cuenta saldada"
                  }
                </p>
              </div>

              {selectedReservation.folios?.[0]?.balance_cents > 0 && (
                <div className="p-3 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ El huésped tiene un balance pendiente. Asegúrate de resolver el pago antes de completar el check-out.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReservation(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckOut} className="bg-front-desk hover:bg-front-desk/90">
              Confirmar Check-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
