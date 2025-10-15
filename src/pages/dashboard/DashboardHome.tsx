import { useOutletContext } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Home } from "lucide-react";
import ReservationsList from "@/components/reservations/ReservationsList";
import InventoryCalendar from "@/components/inventory/InventoryCalendar";
import NewReservationDialog from "@/components/reservations/NewReservationDialog";

export default function DashboardHome() {
  const { hotel } = useOutletContext<{ hotel: any }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen general de las operaciones del hotel
        </p>
      </div>

      <Tabs defaultValue="reservations" className="w-full">
        <TabsList className="bg-card shadow-soft">
          <TabsTrigger value="reservations" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Home className="h-4 w-4" />
            Inventario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Lista de Reservas</h2>
              <NewReservationDialog hotelId={hotel.id} />
            </div>
            <ReservationsList hotelId={hotel.id} />
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Control de Inventario</h2>
            <InventoryCalendar hotelId={hotel.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
