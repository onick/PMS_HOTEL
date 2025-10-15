import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Home, LogOut, Plus } from "lucide-react";
import ReservationsList from "@/components/reservations/ReservationsList";
import InventoryCalendar from "@/components/inventory/InventoryCalendar";
import NewReservationDialog from "@/components/reservations/NewReservationDialog";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Obtener hotel demo (en producción, buscar por user_roles)
    const { data: hotelData } = await supabase
      .from("hotels")
      .select("*")
      .eq("slug", "playa-paraiso")
      .single();

    if (hotelData) {
      setHotel(hotelData);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Sin acceso a hoteles</h2>
          <p className="text-muted-foreground mb-4">
            No tienes permisos asignados. Contacta al administrador.
          </p>
          <Button onClick={handleLogout}>Cerrar sesión</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-ocean p-2 rounded-lg">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{hotel.name}</h1>
              <p className="text-sm text-muted-foreground">{hotel.city}, {hotel.country}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="bg-card shadow-soft mb-6">
            <TabsTrigger value="reservations" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Home className="h-4 w-4" />
              Inventario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Lista de Reservas</h2>
                <NewReservationDialog hotelId={hotel.id} />
              </div>
              <ReservationsList hotelId={hotel.id} />
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Control de Inventario</h2>
              <InventoryCalendar hotelId={hotel.id} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;