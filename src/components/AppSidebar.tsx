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
  Hotel,
  Shield,
  User,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";

const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    color: "text-primary",
    module: "dashboard"
  },
  {
    title: "Reservas",
    url: "/dashboard/reservations",
    icon: CalendarDays,
    color: "text-reservations",
    module: "reservations"
  },
  {
    title: "Front Desk",
    url: "/dashboard/front-desk",
    icon: Hotel,
    color: "text-front-desk",
    module: "front-desk"
  },
  {
    title: "Housekeeping",
    url: "/dashboard/housekeeping",
    icon: BedDouble,
    color: "text-housekeeping",
    module: "housekeeping"
  },
  {
    title: "Facturación",
    url: "/dashboard/billing",
    icon: CreditCard,
    color: "text-billing",
    module: "billing"
  },
  {
    title: "Channel Manager",
    url: "/dashboard/channels",
    icon: Network,
    color: "text-channel-manager",
    module: "channels"
  },
  {
    title: "CRM",
    url: "/dashboard/crm",
    icon: Users,
    color: "text-crm",
    module: "crm"
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    color: "text-analytics",
    module: "reports"
  },
];

const settingsItems = [
  {
    title: "Seguridad",
    url: "/dashboard/security",
    icon: Shield,
    module: "admin"
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
    module: "settings"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;
  const [user, setUser] = useState<any>(null);

  // Get hotel_id
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles-sidebar"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { canAccessModule, isAdmin } = usePermissions(userRoles?.hotel_id);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
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
              {mainItems
                .filter((item) => item.module === "dashboard" || canAccessModule(item.module))
                .map((item) => (
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
              {settingsItems
                .filter((item) => item.module === "settings" || canAccessModule(item.module) || isAdmin)
                .map((item) => (
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

      {/* Footer con usuario */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {collapsed ? (
          <NavLink to="/dashboard/profile" className={getNavCls("/dashboard/profile")}>
            <div className="flex justify-center py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/dashboard/profile"
            className={`${getNavCls("/dashboard/profile")} rounded-lg transition-colors`}
          >
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Usuario
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
