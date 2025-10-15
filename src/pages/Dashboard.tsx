import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Outlet } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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

    // Primero obtenemos el rol del usuario
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("hotel_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .single();

    if (roleError) {
      console.error("Error fetching user role:", roleError);
      setLoading(false);
      return;
    }

    if (!userRole) {
      setLoading(false);
      return;
    }

    // Luego obtenemos los datos del hotel
    const { data: hotelData, error: hotelError } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", userRole.hotel_id)
      .single();

    if (hotelError) {
      console.error("Error fetching hotel:", hotelError);
      toast.error("Error cargando datos del hotel");
    } else {
      setHotel(hotelData);
    }

    setLoading(false);
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
          <p className="text-muted-foreground">
            No tienes permisos asignados. Contacta al administrador.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
            <div className="h-full px-6 flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-foreground">{hotel.name}</h1>
                <p className="text-sm text-muted-foreground">{hotel.city}, {hotel.country}</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Outlet context={{ hotel }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;