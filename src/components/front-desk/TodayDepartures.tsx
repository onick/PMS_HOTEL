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

export default function TodayDepartures() {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const today = new Date().toISOString().split("T")[0];

  const { data: departures, refetch } = useQuery({
    queryKey: ["today-departures"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name),
          folios (balance_cents)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("check_out", today)
        .eq("status", "CHECKED_IN")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleCheckOut = async () => {
    if (!selectedReservation) return;

    try {
      const roomNumber = selectedReservation.metadata?.room_number;

      // Actualizar estado de reserva
      const { error: resError } = await supabase
        .from("reservations")
        .update({ 
          status: "CHECKED_OUT",
          metadata: { 
            ...(selectedReservation.metadata || {}), 
            checked_out_at: new Date().toISOString()
          }
        })
        .eq("id", selectedReservation.id);

      if (resError) throw resError;

      // Liberar habitación - marcar como mantenimiento para limpieza
      if (roomNumber) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "MAINTENANCE" })
          .eq("id", roomNumber);

        if (roomError) throw roomError;
      }

      toast.success("Check-out realizado exitosamente");
      setSelectedReservation(null);
      refetch();
    } catch (error: any) {
      toast.error("Error al realizar check-out: " + error.message);
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
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {reservation.customer.name}
                        </span>
                        {hasBalance && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Balance pendiente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Hab. {reservation.metadata?.room_number || "N/A"}</span>
                        <span>{reservation.room_types?.name}</span>
                        <span>{reservation.guests} huéspedes</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedReservation(reservation)}
                      className="bg-front-desk hover:bg-front-desk/90"
                    >
                      Check-out
                    </Button>
                  </div>
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
