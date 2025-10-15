import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react";
import ReservationsList from "@/components/reservations/ReservationsList";
import NewReservationDialog from "@/components/reservations/NewReservationDialog";
import ReservationFilters, { ReservationFilters as Filters } from "@/components/reservations/ReservationFilters";

export default function Reservations() {
  const { hotel } = useOutletContext<{ hotel: any }>();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    roomType: "all",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleReservationUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Reservas</h1>
          <p className="text-muted-foreground">
            Administra todas las reservas del hotel con filtros avanzados
          </p>
        </div>
        <NewReservationDialog hotelId={hotel.id} />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-reservations/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">124</span>
              <span className="text-xs text-success flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">98</div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">26</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">45</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ReservationFilters onFilterChange={handleFilterChange} />

      {/* Lista de reservas */}
      <ReservationsList 
        key={refreshKey}
        hotelId={hotel.id} 
        filters={filters}
        onUpdate={handleReservationUpdate}
      />
    </div>
  );
}
