import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import ReservationDetails from "./ReservationDetails";

interface ReservationsTimelineProps {
  hotelId: string;
  onUpdate?: () => void;
}

export default function ReservationsTimeline({ hotelId, onUpdate }: ReservationsTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [hotelId, currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const [roomsData, reservationsData] = await Promise.all([
      supabase
        .from("rooms")
        .select("*, room_types(name)")
        .eq("hotel_id", hotelId)
        .order("room_number", { ascending: true }),
      supabase
        .from("reservations")
        .select("*, room_types(name)")
        .eq("hotel_id", hotelId)
        .or(`check_in.lte.${format(end, "yyyy-MM-dd")},check_out.gte.${format(start, "yyyy-MM-dd")}`)
        .order("check_in", { ascending: true })
    ]);

    if (roomsData.error) console.error("Error loading rooms:", roomsData.error);
    else setRooms(roomsData.data || []);

    if (reservationsData.error) console.error("Error loading reservations:", reservationsData.error);
    else setReservations(reservationsData.data || []);

    setLoading(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      CONFIRMED: "bg-blue-500 hover:bg-blue-600",
      PENDING_PAYMENT: "bg-orange-500 hover:bg-orange-600",
      CANCELLED: "bg-red-500 hover:bg-red-600",
      CHECKED_IN: "bg-green-500 hover:bg-green-600",
      CHECKED_OUT: "bg-gray-400 hover:bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-400";
  };

  const getReservationPosition = (reservation: any, days: Date[]) => {
    const checkIn = parseISO(reservation.check_in);
    const checkOut = parseISO(reservation.check_out);
    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    const start = checkIn < firstDay ? 0 : days.findIndex(day => isSameDay(day, checkIn));
    const end = checkOut > lastDay ? days.length - 1 : days.findIndex(day => isSameDay(day, checkOut)) - 1;
    
    if (start === -1 || end < start) return null;

    return {
      start,
      span: end - start + 1
    };
  };

  const getReservationsForRoom = (roomTypeId: string) => {
    return reservations.filter(r => r.room_type_id === roomTypeId);
  };

  const days = getDaysInMonth();
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Group rooms by type
  const roomsByType = rooms.reduce((acc, room) => {
    const typeName = room.room_types?.name || 'Sin tipo';
    if (!acc[typeName]) acc[typeName] = [];
    acc[typeName].push(room);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Cargando calendario...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Timeline de Reservas</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] text-center font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header with dates */}
          <div className="grid gap-0 mb-4" style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}>
            <div className="sticky left-0 bg-background z-10 p-2 border-b font-semibold">
              Habitación
            </div>
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`text-center p-2 border-b text-xs ${
                    isToday ? "bg-primary/10 font-bold text-primary" : ""
                  }`}
                >
                  <div>{format(day, "EEE", { locale: es })}</div>
                  <div className="font-semibold">{format(day, "d")}</div>
                </div>
              );
            })}
          </div>

          {/* Rooms and reservations */}
          {Object.entries(roomsByType).map(([typeName, typeRooms]: [string, any[]]) => (
            <div key={typeName} className="mb-6">
              <div className="font-semibold text-sm text-muted-foreground mb-2 px-2">
                {typeName}
              </div>
              {typeRooms.map((room) => {
                const roomReservations = getReservationsForRoom(room.room_type_id);
                
                return (
                  <div
                    key={room.id}
                    className="grid gap-0 mb-1"
                    style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}
                  >
                    <div className="sticky left-0 bg-background z-10 p-3 border-b border-r font-medium text-sm">
                      {room.room_number}
                    </div>
                    
                    <div className="relative col-span-full border-b" style={{ gridColumn: `2 / ${days.length + 2}` }}>
                      <div className="grid h-12" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                        {days.map((_, idx) => (
                          <div key={idx} className="border-r border-border/50" />
                        ))}
                      </div>
                      
                      {roomReservations.map((reservation) => {
                        const position = getReservationPosition(reservation, days);
                        if (!position) return null;

                        return (
                          <div
                            key={reservation.id}
                            className={`absolute top-1 h-10 rounded-md ${getStatusColor(
                              reservation.status
                            )} text-white text-xs px-2 py-1 cursor-pointer transition-all flex items-center truncate shadow-md`}
                            style={{
                              left: `${(position.start / days.length) * 100}%`,
                              width: `${(position.span / days.length) * 100}%`,
                            }}
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setDetailsOpen(true);
                            }}
                          >
                            <span className="truncate font-medium">
                              {reservation.customer?.name || 'Sin nombre'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm">Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-sm">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <span className="text-sm">Check-out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm">Cancelada</span>
          </div>
        </div>
      </CardContent>

      <ReservationDetails
        reservation={selectedReservation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={() => {
          loadData();
          onUpdate?.();
        }}
      />
    </Card>
  );
}
