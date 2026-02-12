import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  Package,
  ClipboardList,
  UserCog,
  FileBarChart2,
  TrendingUp,
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

const operationsItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    color: "text-primary",
    module: "dashboard",
  },
  {
    title: "Front Desk",
    url: "/dashboard/front-desk",
    icon: Hotel,
    color: "text-front-desk",
    module: "front-desk",
  },
  {
    title: "Reservas",
    url: "/dashboard/reservations",
    icon: CalendarDays,
    color: "text-reservations",
    module: "reservations",
  },
  {
    title: "Housekeeping",
    url: "/dashboard/housekeeping",
    icon: BedDouble,
    color: "text-housekeeping",
    module: "housekeeping",
  },
];

const commercialItems = [
  {
    title: "Channel Manager",
    url: "/dashboard/channels",
    icon: Network,
    color: "text-channel-manager",
    module: "channels",
  },
  {
    title: "Revenue",
    url: "/dashboard/revenue",
    icon: TrendingUp,
    color: "text-revenue",
    module: "revenue",
  },
  {
    title: "CRM",
    url: "/dashboard/crm",
    icon: Users,
    color: "text-crm",
    module: "crm",
  },
];

const financeItems = [
  {
    title: "Facturación",
    url: "/dashboard/billing",
    icon: CreditCard,
    color: "text-billing",
    module: "billing",
  },
  {
    title: "Inventario",
    url: "/dashboard/inventory",
    icon: Package,
    color: "text-inventory",
    module: "inventory",
  },
  {
    title: "Reportes",
    url: "/dashboard/reports",
    icon: FileBarChart2,
    color: "text-reports",
    module: "reports",
  },
];

const managementItems = [
  {
    title: "Tareas",
    url: "/dashboard/tasks",
    icon: ClipboardList,
    color: "text-tasks",
    module: "tasks",
  },
  {
    title: "Staff",
    url: "/dashboard/staff",
    icon: UserCog,
    color: "text-staff",
    module: "staff",
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    color: "text-analytics",
    module: "reports",
  },
];

const systemItems = [
  {
    title: "Seguridad",
    url: "/dashboard/security",
    icon: Shield,
    module: "admin",
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
    module: "settings",
  },
];

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  module: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  { label: "Operaciones", items: operationsItems },
  { label: "Comercial", items: commercialItems },
  { label: "Finanzas", items: financeItems },
  { label: "Gestión", items: managementItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;
  const [user, setUser] = useState<{ email?: string } | null>(null);

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles-sidebar"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const getNavCls = (path: string, color?: string) => {
    const active = isActive(path);
    return active
      ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary rounded-l-none"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors duration-150";
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const canAccess = (item: NavItem) => {
    if (item.module === "dashboard") return true;
    return canAccessModule(item.module);
  };

  const renderGroup = (group: NavGroup) => {
    const visibleItems = group.items.filter(canAccess);
    if (visibleItems.length === 0) return null;

    return (
      <SidebarGroup key={group.label} className="py-2">
        {!collapsed && (
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-[0.12em] font-medium px-3 mb-1">
            {group.label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard"}
                    className={getNavCls(item.url, item.color)}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] ${
                        isActive(item.url)
                          ? item.color || "text-sidebar-primary"
                          : "text-sidebar-foreground/60"
                      }`}
                    />
                    {!collapsed && (
                      <span className="text-[13px]">{item.title}</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar"
    >
      {/* Brand */}
      <div className={cn(
        "py-5 border-b border-sidebar-border/50",
        collapsed ? "px-0 flex justify-center" : "px-4"
      )}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-sm flex-shrink-0">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-[15px] text-sidebar-accent-foreground tracking-tight">
                HotelMate
              </h2>
              <p className="text-[11px] text-sidebar-foreground/50">
                Property Management
              </p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        {navGroups.map(renderGroup)}

        {/* Sistema - solo admin/settings */}
        <SidebarGroup className="py-2 mt-auto">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-[0.12em] font-medium px-3 mb-1">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems
                .filter(
                  (item) =>
                    item.module === "settings" ||
                    canAccessModule(item.module) ||
                    isAdmin,
                )
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={getNavCls(item.url)}
                      >
                        <item.icon className={`h-[18px] w-[18px] ${
                          isActive(item.url) ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                        }`} />
                        {!collapsed && (
                          <span className="text-[13px]">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        {collapsed ? (
          <NavLink to="/dashboard/profile">
            <div className="flex justify-center py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </NavLink>
        ) : (
          <NavLink
            to="/dashboard/profile"
            className="rounded-lg hover:bg-sidebar-accent/50 transition-colors duration-150"
          >
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                  Mi Perfil
                </p>
                <p className="text-[11px] text-sidebar-foreground/50 truncate">
                  {user?.email}
                </p>
              </div>
              <User className="h-4 w-4 text-sidebar-foreground/40" />
            </div>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
