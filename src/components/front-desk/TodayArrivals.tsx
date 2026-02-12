import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestListItem } from "./common/GuestListItem";

export default function TodayArrivals({ hotelId }: { hotelId: string }) {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const { data: arrivals, refetch } = useQuery({
    queryKey: ["today-arrivals", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", hotelId)
        .eq("check_in", today)
        .eq("status", "CONFIRMED")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", hotelId, selectedReservation?.room_type_id],
    enabled: !!hotelId && !!selectedReservation,
    queryFn: async () => {
      if (!selectedReservation || !hotelId) return [];

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("room_type_id", selectedReservation.room_type_id)
        .eq("status", "AVAILABLE")
        .order("room_number");

      if (error) throw error;
      return data || [];
    },
  });

  const handleCheckIn = async () => {
    if (!selectedRoom || !selectedReservation) {
      toast.error("Por favor selecciona una habitación");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            reservationId: selectedReservation.id,
            roomId: selectedRoom,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Error al realizar check-in");
      }

      toast.success(`Check-in realizado exitosamente - Habitación ${responseData.roomNumber}`);
      setSelectedReservation(null);
      setSelectedRoom("");
      refetch();
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error(error.message || "Error al realizar check-in");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-front-desk">
            <LogIn className="h-5 w-5" />
            Llegadas de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!arrivals?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No hay llegadas programadas para hoy
            </p>
          ) : (
            <div className="space-y-3">
              {arrivals.map((reservation: any) => (
                <GuestListItem
                  key={reservation.id}
                  id={reservation.id}
                  guestName={reservation.customer.name}
                  guestsCount={reservation.guests}
                  roomType={reservation.roomType?.name || "Standard"}
                  date={formatDate(reservation.check_in)}
                  status={reservation.status}
                  type="arrival"
                  onAction={() => setSelectedReservation(reservation)}
                  actionLabel="Check-in"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Check-in</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Huésped</p>
                <p className="text-lg">{selectedReservation.customer.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Tipo de habitación</p>
                <p>{selectedReservation.room_types?.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Asignar habitación</p>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms?.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        Habitación {room.room_number}
                        {room.floor && ` - Piso ${room.floor}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReservation(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckIn} className="bg-front-desk hover:bg-front-desk/90">
              Confirmar Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
