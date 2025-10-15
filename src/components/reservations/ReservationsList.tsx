import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  total_amount_cents: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
  room_types: {
    name: string;
  };
}

const ReservationsList = ({ hotelId }: { hotelId: string }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();

    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        room_types (name)
      `)
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setReservations(data as any);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING_PAYMENT: "bg-yellow-500/20 text-yellow-700",
      CONFIRMED: "bg-green-500/20 text-green-700",
      CANCELLED: "bg-red-500/20 text-red-700",
      EXPIRED: "bg-gray-500/20 text-gray-700",
      CHECKED_IN: "bg-blue-500/20 text-blue-700",
      CHECKED_OUT: "bg-purple-500/20 text-purple-700",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500/20";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING_PAYMENT: "Pendiente Pago",
      CONFIRMED: "Confirmada",
      CANCELLED: "Cancelada",
      EXPIRED: "Expirada",
      CHECKED_IN: "Check-in",
      CHECKED_OUT: "Check-out",
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando reservas...</div>;
  }

  if (reservations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No hay reservas aún</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {reservations.map((reservation) => (
        <Card key={reservation.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{reservation.customer.name}</h3>
              <p className="text-sm text-muted-foreground">{reservation.customer.email}</p>
            </div>
            <Badge className={getStatusColor(reservation.status)}>
              {getStatusLabel(reservation.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{reservation.guests} huésped{reservation.guests > 1 ? 'es' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">
                {reservation.currency} ${(reservation.total_amount_cents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <span className="text-sm font-medium">{reservation.room_types?.name}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ReservationsList;