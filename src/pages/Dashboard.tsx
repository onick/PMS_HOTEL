import { useState, useEffect } from "react";
import { supabase, DEMO_MODE, DEMO_USER } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useNavigate, Outlet } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useModuleContext } from "@/hooks/useModuleContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// 🎮 Datos demo para el hotel
const DEMO_HOTEL = {
  id: 'demo-hotel-1',
  name: 'Hotel Playa Paraíso',
  address: 'Calle Principal #123',
  city: 'Pedernales',
  state: 'Pedernales',
  country: 'República Dominicana',
  postal_code: '18004',
  phone: '+1 (809) 555-0100',
  email: 'info@playaparaiso.do',
  website: 'https://playaparaiso.do',
  currency: 'DOP',
  timezone: 'America/Santo_Domingo',
  tax_rate: 18.00,
  check_in_time: '15:00:00',
  check_out_time: '12:00:00',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const activeModule = useModuleContext();
  const isMobile = useIsMobile();
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

    // Modo Demo: always login to Laravel API and fetch real hotel data
    if (DEMO_MODE) {
      try {
        await api.login('admin@hoteldemo.com', 'password');
        const res = await api.getHotel();
        setHotel(res.data);
      } catch (err) {
        console.warn("Laravel API unavailable, using offline demo:", err);
        setHotel(DEMO_HOTEL);
      }
      setLoading(false);
      return;
    }

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Also clear Laravel API token
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem('api_token');
    navigate("/auth");
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-border/60 bg-card/90 backdrop-blur-sm sticky top-0 z-10">
            <div className="h-full px-3 md:px-6 flex items-center gap-3 md:gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

              {/* Divider */}
              <div className="h-5 w-px bg-border/60 hidden sm:block" />

              {/* Module Badge + Hotel Info */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {/* Contextual Module Badge */}
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${activeModule.dotClass}`} />
                  <span className={`text-sm font-medium ${activeModule.colorClass} hidden sm:inline`}>
                    {activeModule.label}
                  </span>
                </div>

                {/* Hotel name - desktop only */}
                <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
                  <span className="text-border">|</span>
                  <span className="text-sm truncate">{hotel.name}</span>
                </div>
              </div>
              
              {/* Mobile: Show only icons */}
              <div className="flex items-center gap-2 md:gap-3 ml-auto">
                <NotificationBell hotelId={hotel.id} />
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full">
                      <Avatar className="h-8 w-8 md:h-9 md:w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Mi Cuenta</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                      {theme === "dark" ? (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Modo Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Modo Oscuro</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content - Responsive padding */}
          <main className={cn("flex-1 p-3 md:p-6", isMobile && "pb-20")}>
            <Outlet context={{ hotel }} />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;