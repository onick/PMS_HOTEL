import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Users, Calendar, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import ReservationDetails from "./ReservationDetails";

interface ReservationsTimelineProps {
  hotelId: string;
  onUpdate?: () => void;
}

export default function ReservationsTimeline({ hotelId, onUpdate }: ReservationsTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [hotelId, currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const [roomTypesData, roomsData, reservationsData] = await Promise.all([
      supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("name", { ascending: true }),
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

    if (roomTypesData.error) console.error("Error loading room types:", roomTypesData.error);
    else {
      setRoomTypes(roomTypesData.data || []);
      // Expand all types by default
      setExpandedTypes(new Set((roomTypesData.data || []).map((rt: any) => rt.id)));
    }

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

  const getStatusLabel = (status: string) => {
    const labels = {
      CONFIRMED: "Confirmada",
      PENDING_PAYMENT: "Pendiente de pago",
      CANCELLED: "Cancelada",
      CHECKED_IN: "Check-in realizado",
      CHECKED_OUT: "Check-out realizado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'DOP',
    }).format(cents / 100);
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

  const getReservationsForRoomType = (roomTypeId: string) => {
    return reservations.filter(r => r.room_type_id === roomTypeId);
  };

  const getRoomsForType = (roomTypeId: string) => {
    return rooms.filter(r => r.room_type_id === roomTypeId);
  };

  const getAvailabilityForDay = (roomTypeId: string, day: Date) => {
    const typeRooms = getRoomsForType(roomTypeId);
    const totalRooms = typeRooms.length;
    const dayStr = format(day, "yyyy-MM-dd");
    
    const reservedCount = reservations.filter(r => {
      if (r.room_type_id !== roomTypeId) return false;
      const checkIn = parseISO(r.check_in);
      const checkOut = parseISO(r.check_out);
      return checkIn <= day && checkOut > day;
    }).length;

    return {
      total: totalRooms,
      reserved: reservedCount,
      available: totalRooms - reservedCount
    };
  };

  const getAvailabilityColor = (available: number, total: number) => {
    if (total === 0) return "bg-muted text-muted-foreground";
    if (available === 0) return "bg-destructive text-destructive-foreground";
    if (available <= total * 0.3) return "bg-orange-500 text-white";
    return "bg-green-500 text-white";
  };

  const toggleRoomType = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

  const days = getDaysInMonth();
  const previousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setCurrentYear(newMonth.getFullYear());
  };
  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setCurrentYear(newMonth.getFullYear());
  };
  const selectMonth = (month: Date) => {
    setCurrentMonth(month);
  };
  const selectYear = (year: number) => {
    setCurrentYear(year);
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };


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
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Timeline de Reservas</CardTitle>
        </div>

        {/* Month selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {months.map((month) => {
            const isCurrentMonth = 
              month.getMonth() === currentMonth.getMonth() && 
              month.getFullYear() === currentMonth.getFullYear();
            return (
              <Button
                key={month.toISOString()}
                variant={isCurrentMonth ? "default" : "outline"}
                size="sm"
                onClick={() => selectMonth(month)}
                className="min-w-[90px]"
              >
                {format(month, "MMMM yyyy", { locale: es })}
              </Button>
            );
          })}
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[1400px]">
          {/* Header with dates */}
          <div className="grid gap-0 mb-2 sticky top-0 bg-background z-20" style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(50px, 1fr))` }}>
            <div className="sticky left-0 bg-background z-10 p-2 border-b font-semibold text-sm">
              Habitaciones
            </div>
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`text-center p-1 border-b text-xs ${
                    isToday ? "bg-primary/10 font-bold text-primary" : ""
                  }`}
                >
                  <div className="font-medium">{format(day, "EEE", { locale: es })}</div>
                  <div className="font-bold">{format(day, "d")}</div>
                </div>
              );
            })}
          </div>

          {/* Room types and rooms */}
          {roomTypes.map((roomType) => {
            const typeRooms = getRoomsForType(roomType.id);
            const isExpanded = expandedTypes.has(roomType.id);
            
            return (
              <div key={roomType.id} className="mb-4 border rounded-lg overflow-hidden">
                {/* Room type header with availability indicators */}
                <div className="grid gap-0 bg-muted/50" style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(50px, 1fr))` }}>
                  <div 
                    className="sticky left-0 bg-muted z-10 p-2 border-b border-r font-semibold text-sm flex items-center gap-2 cursor-pointer hover:bg-muted/80"
                    onClick={() => toggleRoomType(roomType.id)}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <div>
                      <div>{roomType.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {typeRooms.length} habitación{typeRooms.length !== 1 ? 'es' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {days.map((day) => {
                    const { available, total } = getAvailabilityForDay(roomType.id, day);
                    return (
                      <div
                        key={day.toISOString()}
                        className="flex items-center justify-center border-b border-r p-1"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvailabilityColor(available, total)}`}>
                          {available}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Individual rooms */}
                {isExpanded && typeRooms.map((room) => {
                  const roomReservations = reservations.filter(r => r.room_type_id === roomType.id);
                  
                  return (
                    <div
                      key={room.id}
                      className="grid gap-0"
                      style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(50px, 1fr))` }}
                    >
                      <div className="sticky left-0 bg-background z-10 p-2 border-b border-r text-sm flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          room.status === 'AVAILABLE' ? 'bg-green-500' :
                          room.status === 'OCCUPIED' ? 'bg-blue-500' :
                          room.status === 'DIRTY' ? 'bg-orange-500' :
                          room.status === 'MAINTENANCE' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="font-medium">{room.room_number}</span>
                      </div>
                      
                      <div className="relative col-span-full border-b">
                        <div className="grid h-12" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(50px, 1fr))` }}>
                          {days.map((_, idx) => (
                            <div key={idx} className="border-r border-border/30" />
                          ))}
                        </div>
                        
                        {roomReservations.map((reservation) => {
                          const position = getReservationPosition(reservation, days);
                          if (!position) return null;

                          return (
                            <Tooltip key={reservation.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`absolute top-1 h-10 rounded ${getStatusColor(
                                    reservation.status
                                  )} text-white text-xs px-2 py-1 cursor-pointer transition-all flex items-center truncate shadow-sm`}
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
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  <div className="font-semibold text-base">
                                    {reservation.customer?.name || 'Sin nombre'}
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {format(parseISO(reservation.check_in), "dd MMM", { locale: es })} - {format(parseISO(reservation.check_out), "dd MMM yyyy", { locale: es })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      <span>{reservation.guests} huésped{reservation.guests !== 1 ? 'es' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-3 w-3" />
                                      <span>{formatCurrency(reservation.total_amount_cents, reservation.currency)}</span>
                                    </div>
                                    <div className="pt-1 border-t mt-2">
                                      <span className="text-xs font-medium">
                                        Estado: {getStatusLabel(reservation.status)}
                                      </span>
                                    </div>
                                    {reservation.customer?.email && (
                                      <div className="text-xs text-muted-foreground">
                                        {reservation.customer.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
