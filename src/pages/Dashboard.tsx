import { useState, useEffect } from "react";
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

const SESSION_IDLE_MINUTES = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES ?? 30);
const SESSION_WARNING_MINUTES = Number(import.meta.env.VITE_SESSION_WARNING_MINUTES ?? 2);
const SESSION_ACTIVITY_KEY = "auth:last_activity_at";

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

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      if (customEvent.detail?.reason === "idle_timeout") {
        toast.info("Sesión cerrada por inactividad");
      } else {
        toast.error("Tu sesión expiró, inicia sesión nuevamente.");
      }
      navigate("/auth");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized as EventListener);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized as EventListener);
    };
  }, [navigate]);

  useEffect(() => {
    if (!api.getToken()) return;
    if (Number.isNaN(SESSION_IDLE_MINUTES) || SESSION_IDLE_MINUTES <= 0) return;

    let warned = false;
    let closed = false;
    const idleMs = SESSION_IDLE_MINUTES * 60 * 1000;
    const warningMs = Math.max(0, SESSION_WARNING_MINUTES) * 60 * 1000;

    const markActivity = () => {
      localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
      warned = false;
    };

    const checkIdle = () => {
      if (closed) return;

      const lastActivity = Number(localStorage.getItem(SESSION_ACTIVITY_KEY) || Date.now());
      const elapsed = Date.now() - lastActivity;
      const remaining = idleMs - elapsed;

      if (remaining <= 0) {
        closed = true;
        api.clearToken();
        localStorage.removeItem("api_token");
        window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: { reason: "idle_timeout" } }));
        return;
      }

      if (!warned && warningMs > 0 && remaining <= warningMs) {
        warned = true;
        const minutesLeft = Math.max(1, Math.ceil(remaining / 60000));
        toast.warning(`Tu sesión expirará en ${minutesLeft} min por inactividad.`);
      }
    };

    markActivity();

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const intervalId = window.setInterval(checkIdle, 15000);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity as EventListener);
      });
    };
  }, []);

  const checkUser = async () => {
    const token = api.getToken();
    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      // Get user profile (includes current_hotel)
      const meRes = await api.me();
      const userData = (meRes as any).user || meRes.data;
      setUser(userData);

      // Get full hotel data
      try {
        const hotelRes = await api.getHotel();
        setHotel(hotelRes.data);
      } catch {
        // Use the hotel info from user profile as fallback
        if (userData.current_hotel) {
          setHotel(userData.current_hotel);
        } else {
          toast.error("Error cargando datos del hotel");
        }
      }
    } catch {
      // Token invalid — redirect to login
      localStorage.removeItem("api_token");
      navigate("/auth");
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clear token even if server call fails
    }
    localStorage.removeItem("api_token");
    navigate("/auth");
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
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
                <NotificationBell />

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
                        <p className="text-sm font-medium">{user?.name || "Mi Cuenta"}</p>
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
