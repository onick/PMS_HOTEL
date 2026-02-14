import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type AppRole = "SUPER_ADMIN" | "HOTEL_OWNER" | "MANAGER" | "RECEPTION" | "HOUSEKEEPING" | "SALES";

export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-permissions"],
    queryFn: async () => {
      const res = await api.getPermissions();
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    enabled: !!api.getToken(),
  });

  const userRole = (data?.role as AppRole) || null;
  const permissions = data?.permissions || [];
  const modules = data?.modules || [];

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false;
    if (userRole === "SUPER_ADMIN" || userRole === "HOTEL_OWNER") return true;
    return permissions.includes(permission);
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (!userRole) return false;
    if (userRole === "SUPER_ADMIN" || userRole === "HOTEL_OWNER") return true;

    // Map frontend module names to backend module names
    const moduleMap: Record<string, string[]> = {
      "front-desk": ["rooms", "reservations"],
      "channels": ["settings"],
      "revenue": ["rates", "settings"],
      "crm": ["guests"],
      "billing": ["billing"],
      "inventory": ["inventory"],
      "reports": ["reports"],
      "tasks": ["tasks"],
      "staff": ["staff"],
      "analytics": ["reports"],
      "housekeeping": ["housekeeping"],
      "admin": ["audit_log"],
      "settings": ["settings"],
      "reservations": ["reservations"],
    };

    const backendModules = moduleMap[moduleName] || [moduleName];
    return backendModules.some((m) => modules.includes(m));
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
