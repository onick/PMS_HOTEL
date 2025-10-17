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

export default function TodayArrivals() {
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const { data: arrivals, refetch } = useQuery({
    queryKey: ["today-arrivals"],
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
          room_types (name)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("check_in", today)
        .eq("status", "CONFIRMED")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", selectedReservation?.room_type_id],
    enabled: !!selectedReservation,
    queryFn: async () => {
      if (!selectedReservation) return [];

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", userRoles?.hotel_id)
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
                      <Badge variant={reservation.status === "CONFIRMED" ? "default" : "secondary"}>
                        {reservation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{reservation.room_types?.name}</span>
                      <span>{reservation.guests} huéspedes</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedReservation(reservation)}
                    className="bg-front-desk hover:bg-front-desk/90"
                  >
                    Check-in
                  </Button>
                </div>
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
