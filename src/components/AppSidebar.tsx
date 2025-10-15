import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Home,
  BedDouble,
  CreditCard,
  Network,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Hotel,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const mainItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: Home,
    color: "text-primary"
  },
  { 
    title: "Reservas", 
    url: "/dashboard/reservations", 
    icon: CalendarDays,
    color: "text-reservations"
  },
  { 
    title: "Front Desk", 
    url: "/dashboard/front-desk", 
    icon: Hotel,
    color: "text-front-desk"
  },
  { 
    title: "Housekeeping", 
    url: "/dashboard/housekeeping", 
    icon: BedDouble,
    color: "text-housekeeping"
  },
  { 
    title: "Facturación", 
    url: "/dashboard/billing", 
    icon: CreditCard,
    color: "text-billing"
  },
  { 
    title: "Channel Manager", 
    url: "/dashboard/channels", 
    icon: Network,
    color: "text-channel-manager"
  },
  { 
    title: "CRM", 
    url: "/dashboard/crm", 
    icon: Users,
    color: "text-crm"
  },
  { 
    title: "Analytics", 
    url: "/dashboard/analytics", 
    icon: BarChart3,
    color: "text-analytics"
  },
];

const settingsItems = [
  { 
    title: "Seguridad", 
    url: "/dashboard/security", 
    icon: Shield,
  },
  { 
    title: "Configuración", 
    url: "/dashboard/settings", 
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
      : "hover:bg-muted/50 transition-smooth";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar"
    >
      {/* Header con logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-ocean p-2 rounded-lg">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">SOLARIS PMS</h2>
              <p className="text-xs text-muted-foreground">Sistema Hotelero</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        {/* Módulos principales */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground">
              Módulos
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={getNavCls(item.url)}
                    >
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuración */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer con logout */}
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
