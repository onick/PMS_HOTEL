import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReservationsList from "@/components/reservations/ReservationsList";
import ReservationsCalendar from "@/components/reservations/ReservationsCalendar";
import ReservationsTimeline from "@/components/reservations/ReservationsTimeline";
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Gestión de Reservas</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Administra todas las reservas del hotel con filtros avanzados
          </p>
        </div>
        <NewReservationDialog />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">124</span>
              <span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">98</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">26</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">45</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para vistas */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <ReservationsTimeline hotelId={hotel.id} onUpdate={handleReservationUpdate} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <ReservationFilters onFilterChange={handleFilterChange} />
          <ReservationsList
            key={refreshKey}
            hotelId={hotel.id}
            filters={filters}
            onUpdate={handleReservationUpdate}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <ReservationsCalendar
            hotelId={hotel.id}
            onUpdate={handleReservationUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
