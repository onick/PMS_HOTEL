import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import ReservationDetails from "./ReservationDetails";

interface ReservationsCalendarProps {
  hotelId: string;
  onUpdate?: () => void;
}

export default function ReservationsCalendar({ hotelId, onUpdate }: ReservationsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [hotelId, currentMonth]);

  const loadReservations = async () => {
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("hotel_id", hotelId)
      .or(`check_in.lte.${format(end, "yyyy-MM-dd")},check_out.gte.${format(start, "yyyy-MM-dd")}`)
      .order("check_in", { ascending: true });

    if (error) {
      console.error("Error loading reservations:", error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getReservationsForDay = (day: Date) => {
    return reservations.filter((reservation) => {
      const checkIn = parseISO(reservation.check_in);
      const checkOut = parseISO(reservation.check_out);
      return day >= checkIn && day < checkOut;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      CONFIRMED: "bg-success/80 hover:bg-success",
      PENDING_PAYMENT: "bg-warning/80 hover:bg-warning",
      CANCELLED: "bg-destructive/80 hover:bg-destructive",
      CHECKED_IN: "bg-primary/80 hover:bg-primary",
      CHECKED_OUT: "bg-muted hover:bg-muted-foreground",
    };
    return colors[status as keyof typeof colors] || "bg-muted";
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const days = getDaysInMonth();
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const firstDayOfWeek = days[0].getDay() === 0 ? 6 : days[0].getDay() - 1;

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
          <CardTitle>Calendario de Reservas</CardTitle>
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
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          
          {days.map((day) => {
            const dayReservations = getReservationsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  isToday ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <Badge
                      key={reservation.id}
                      className={`w-full justify-start text-xs cursor-pointer text-white truncate ${getStatusColor(
                        reservation.status
                      )}`}
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setDetailsOpen(true);
                      }}
                    >
                      {reservation.customer.name}
                    </Badge>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayReservations.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/80" />
            <span className="text-sm">Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/80" />
            <span className="text-sm">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/80" />
            <span className="text-sm">Check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm">Check-out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/80" />
            <span className="text-sm">Cancelada</span>
          </div>
        </div>
      </CardContent>

      <ReservationDetails
        reservation={selectedReservation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={() => {
          loadReservations();
          onUpdate?.();
        }}
      />
    </Card>
  );
}
