import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "SUPER_ADMIN" | "HOTEL_OWNER" | "MANAGER" | "RECEPTION" | "HOUSEKEEPING" | "SALES";

interface Permission {
  module: string;
  action: string;
  resource?: string;
}

export function usePermissions(hotelId?: string) {
  const { data: userRole, isLoading } = useQuery({
    queryKey: ["user-role", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("hotel_id", hotelId!)
        .single();

      if (error) throw error;
      return data?.role as AppRole;
    },
  });

  const hasPermission = (module: string, action: string, resource?: string): boolean => {
    if (!userRole) return false;

    // SUPER_ADMIN y HOTEL_OWNER tienen acceso completo
    if (userRole === "SUPER_ADMIN" || userRole === "HOTEL_OWNER") {
      return true;
    }

    // Permisos por rol
    const rolePermissions: Record<AppRole, Permission[]> = {
      SUPER_ADMIN: [{ module: "*", action: "*" }],
      HOTEL_OWNER: [{ module: "*", action: "*" }],
      MANAGER: [
        { module: "reservations", action: "create" },
        { module: "reservations", action: "read" },
        { module: "reservations", action: "update" },
        { module: "reservations", action: "delete" },
        { module: "reservations", action: "export" },
        { module: "crm", action: "create" },
        { module: "crm", action: "read" },
        { module: "crm", action: "update" },
        { module: "crm", action: "delete" },
        { module: "crm", action: "export" },
        { module: "billing", action: "create" },
        { module: "billing", action: "read" },
        { module: "billing", action: "update" },
        { module: "billing", action: "delete" },
        { module: "billing", action: "export" },
        { module: "housekeeping", action: "read" },
        { module: "housekeeping", action: "update" },
        { module: "reports", action: "read" },
        { module: "reports", action: "export" },
        { module: "settings", action: "read" },
        { module: "settings", action: "update" },
      ],
      RECEPTION: [
        { module: "reservations", action: "create" },
        { module: "reservations", action: "read" },
        { module: "reservations", action: "update" },
        { module: "crm", action: "create" },
        { module: "crm", action: "read" },
        { module: "crm", action: "update" },
        { module: "billing", action: "create" },
        { module: "billing", action: "read" },
        { module: "front-desk", action: "create" },
        { module: "front-desk", action: "read" },
        { module: "front-desk", action: "update" },
      ],
      HOUSEKEEPING: [
        { module: "housekeeping", action: "read" },
        { module: "housekeeping", action: "update" },
        { module: "rooms", action: "read" },
      ],
      SALES: [
        { module: "reservations", action: "create" },
        { module: "reservations", action: "read" },
        { module: "reservations", action: "update" },
        { module: "crm", action: "create" },
        { module: "crm", action: "read" },
        { module: "crm", action: "update" },
        { module: "reports", action: "read" },
      ],
    };

    const permissions = rolePermissions[userRole] || [];

    return permissions.some((perm) => {
      const moduleMatch = perm.module === "*" || perm.module === module;
      const actionMatch = perm.action === "*" || perm.action === action;
      const resourceMatch = !resource || !perm.resource || perm.resource === resource;

      return moduleMatch && actionMatch && resourceMatch;
    });
  };

  const canAccessModule = (moduleName: string): boolean => {
    return hasPermission(moduleName, "read");
  };

  return {
    userRole,
    isLoading,
    hasPermission,
    canAccessModule,
    isAdmin: userRole === "SUPER_ADMIN" || userRole === "HOTEL_OWNER",
    isManager: userRole === "MANAGER",
    isReception: userRole === "RECEPTION",
    isHousekeeping: userRole === "HOUSEKEEPING",
    isSales: userRole === "SALES",
  };
}
