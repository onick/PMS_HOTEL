import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { Calendar, Users, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import ReservationDetails from "./ReservationDetails";
import { ReservationFilters } from "./ReservationFilters";
import { ReservationsListSkeleton } from "@/components/ui/skeletons/ReservationSkeleton";

interface ReservationsListProps {
  hotelId?: string;
  filters?: ReservationFilters;
  onUpdate?: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function ReservationsList({ filters, onUpdate }: ReservationsListProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadReservations();
  }, [filters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadReservations = async () => {
    setLoading(true);

    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: ITEMS_PER_PAGE.toString(),
      };

      if (filters?.status && filters.status !== "all") {
        params.status = filters.status;
      }

      if (filters?.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters?.dateRange?.from) {
        params.from_date = filters.dateRange.from.toISOString().split("T")[0];
      }

      if (filters?.dateRange?.to) {
        params.to_date = filters.dateRange.to.toISOString().split("T")[0];
      }

      const res = await api.getReservations(params);
      setReservations(res.data || []);
      setTotalCount(res.meta?.total || 0);
    } catch (error) {
      console.error("Error loading reservations:", error);
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
    const styles: Record<string, string> = {
      CONFIRMED: "bg-success/10 text-success border-success/20",
      PENDING: "bg-warning/10 text-warning border-warning/20",
      CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
      CHECKED_IN: "bg-primary/10 text-primary border-primary/20",
      CHECKED_OUT: "bg-muted text-muted-foreground",
      NO_SHOW: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const labels: Record<string, string> = {
      CONFIRMED: "Confirmada",
      PENDING: "Pendiente",
      CANCELLED: "Cancelada",
      CHECKED_IN: "Check-in",
      CHECKED_OUT: "Check-out",
      NO_SHOW: "No Show",
    };
    return (
      <Badge className={styles[status] || "bg-muted"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getGuestName = (reservation: any) => {
    return reservation.guest?.full_name || "Sin nombre";
  };

  const getRoomTypeName = (reservation: any) => {
    return reservation.units?.[0]?.room_type?.name || "N/A";
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
                  <h3 className="font-semibold text-lg">{getGuestName(reservation)}</h3>
                  {getStatusBadge(reservation.status)}
                  {reservation.confirmation_code && (
                    <span className="text-xs text-muted-foreground font-mono">
                      #{reservation.confirmation_code}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(reservation.check_in_date)} - {formatDate(reservation.check_out_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{reservation.total_adults} huéspedes</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Habitación: </span>
                  <span className="font-medium">{getRoomTypeName(reservation)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(reservation.total_cents)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} reservas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
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
              Siguiente
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
