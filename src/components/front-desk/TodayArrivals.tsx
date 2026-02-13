import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
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

export default function TodayArrivals() {
  const queryClient = useQueryClient();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const { data: arrivalsRes } = useQuery({
    queryKey: ["today-arrivals"],
    queryFn: () => api.getTodayArrivals(),
  });

  const arrivals = arrivalsRes?.data || [];

  // Get the room_type_id from the first unit of selected reservation
  const selectedRoomTypeId = selectedReservation?.units?.[0]?.room_type?.id;

  // Fetch available rooms for the selected room type
  const { data: roomsRes } = useQuery({
    queryKey: ["available-rooms", selectedRoomTypeId],
    enabled: !!selectedRoomTypeId,
    queryFn: () =>
      api.getRooms({
        room_type_id: String(selectedRoomTypeId),
        available_only: "1",
      }),
  });

  const availableRooms = roomsRes?.data || [];

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoom || !selectedReservation) {
        throw new Error("Por favor selecciona una habitación");
      }
      return api.checkIn(selectedReservation.id, {
        room_assignments: [Number(selectedRoom)],
      });
    },
    onSuccess: (res) => {
      toast.success("Check-in realizado exitosamente");
      setSelectedReservation(null);
      setSelectedRoom("");
      queryClient.invalidateQueries({ queryKey: ["today-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al realizar check-in");
    },
  });

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
                  guestName={reservation.guest?.full_name || `${reservation.guest?.first_name || ""} ${reservation.guest?.last_name || ""}`}
                  guestsCount={reservation.total_adults + (reservation.total_children || 0)}
                  roomType={reservation.units?.[0]?.room_type?.name || "Standard"}
                  date={formatDate(reservation.check_in_date)}
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
                <p className="text-lg">
                  {selectedReservation.guest?.full_name || `${selectedReservation.guest?.first_name || ""} ${selectedReservation.guest?.last_name || ""}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Tipo de habitación</p>
                <p>{selectedReservation.units?.[0]?.room_type?.name || "—"}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Asignar habitación</p>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms?.map((room: any) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        Habitación {room.number}
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
            <Button
              onClick={() => checkInMutation.mutate()}
              disabled={!selectedRoom || checkInMutation.isPending}
              className="bg-front-desk hover:bg-front-desk/90"
            >
              {checkInMutation.isPending ? "Procesando..." : "Confirmar Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
