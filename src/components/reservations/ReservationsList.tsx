import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { Calendar, Users, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import ReservationDetails from "./ReservationDetails";
import { ReservationFilters } from "./ReservationFilters";
import { ReservationsListSkeleton } from "@/components/ui/skeletons/ReservationSkeleton";

interface ReservationsListProps {
  hotelId: string;
  filters?: ReservationFilters;
  onUpdate?: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function ReservationsList({ hotelId, filters, onUpdate }: ReservationsListProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadReservations();
  }, [hotelId, filters, currentPage]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters]);

  const loadReservations = async () => {
    setLoading(true);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("reservations")
      .select("*, room_types(name)", { count: 'exact' })
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

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error loading reservations:", error);
    } else {
      setReservations(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
    return <ReservationsListSkeleton />;
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
    <div className="space-y-4">
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

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} reservations
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
