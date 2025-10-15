import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { Calendar, Users, Eye, ChevronRight } from "lucide-react";
import ReservationDetails from "./ReservationDetails";
import { ReservationFilters } from "./ReservationFilters";

interface ReservationsListProps {
  hotelId: string;
  filters?: ReservationFilters;
  onUpdate?: () => void;
}

export default function ReservationsList({ hotelId, filters, onUpdate }: ReservationsListProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [hotelId, filters]);

  const loadReservations = async () => {
    setLoading(true);
    let query = supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("hotel_id", hotelId);

    // Aplicar filtros
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status as any);
    }

    if (filters?.search && filters.search.trim()) {
      // Buscar en nombre o email del cliente usando filtros en JSONB
      const searchPattern = `%${filters.search}%`;
      query = query.or(
        `customer->>name.ilike.${searchPattern},customer->>email.ilike.${searchPattern}`
      );
    }

    if (filters?.dateRange?.from) {
      query = query.gte("check_in", filters.dateRange.from.toISOString().split("T")[0]);
    }

    if (filters?.dateRange?.to) {
      query = query.lte("check_out", filters.dateRange.to.toISOString().split("T")[0]);
    }

    query = query.order("created_at", { ascending: false }).limit(20);

    const { data, error } = await query;

    if (error) {
      console.error("Error loading reservations:", error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      CONFIRMED: "bg-success/10 text-success border-success/20",
      PENDING_PAYMENT: "bg-warning/10 text-warning border-warning/20",
      CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const labels = {
      CONFIRMED: "Confirmada",
      PENDING_PAYMENT: "Pendiente",
      CANCELLED: "Cancelada",
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando reservas...
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No se encontraron reservas con los filtros aplicados
        </p>
      </Card>
    );
  }

  return (
    <div>
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <Card 
              key={reservation.id} 
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedReservation(reservation);
                setDetailsOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{reservation.customer.name}</h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{reservation.guests} huéspedes</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Habitación: </span>
                    <span className="font-medium">{reservation.room_types?.name || "N/A"}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(reservation.total_amount_cents)}
                    </div>
                    <div className="text-xs text-muted-foreground">{reservation.currency}</div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReservation(reservation);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalles
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReservationDetails
        reservation={selectedReservation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={() => {
          loadReservations();
          onUpdate?.();
        }}
      />
    </div>
  );
}
