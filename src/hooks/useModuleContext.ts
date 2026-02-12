import { useLocation } from "react-router-dom";
import { useMemo } from "react";

type ModuleInfo = {
  key: string;
  label: string;
  colorClass: string;
  dotClass: string;
};

const MODULE_MAP: Record<string, ModuleInfo> = {
  "/dashboard/front-desk": {
    key: "front-desk",
    label: "Front Desk",
    colorClass: "text-front-desk",
    dotClass: "bg-front-desk",
  },
  "/dashboard/reservations": {
    key: "reservations",
    label: "Reservas",
    colorClass: "text-reservations",
    dotClass: "bg-reservations",
  },
  "/dashboard/housekeeping": {
    key: "housekeeping",
    label: "Housekeeping",
    colorClass: "text-housekeeping",
    dotClass: "bg-housekeeping",
  },
  "/dashboard/channels": {
    key: "channels",
    label: "Channel Manager",
    colorClass: "text-channel-manager",
    dotClass: "bg-channel-manager",
  },
  "/dashboard/revenue": {
    key: "revenue",
    label: "Revenue",
    colorClass: "text-revenue",
    dotClass: "bg-revenue",
  },
  "/dashboard/crm": {
    key: "crm",
    label: "CRM",
    colorClass: "text-crm",
    dotClass: "bg-crm",
  },
  "/dashboard/billing": {
    key: "billing",
    label: "Facturación",
    colorClass: "text-billing",
    dotClass: "bg-billing",
  },
  "/dashboard/inventory": {
    key: "inventory",
    label: "Inventario",
    colorClass: "text-inventory",
    dotClass: "bg-inventory",
  },
  "/dashboard/reports": {
    key: "reports",
    label: "Reportes",
    colorClass: "text-reports",
    dotClass: "bg-reports",
  },
  "/dashboard/tasks": {
    key: "tasks",
    label: "Tareas",
    colorClass: "text-tasks",
    dotClass: "bg-tasks",
  },
  "/dashboard/staff": {
    key: "staff",
    label: "Staff",
    colorClass: "text-staff",
    dotClass: "bg-staff",
  },
  "/dashboard/analytics": {
    key: "analytics",
    label: "Analytics",
    colorClass: "text-analytics",
    dotClass: "bg-analytics",
  },
  "/dashboard/security": {
    key: "security",
    label: "Seguridad",
    colorClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  "/dashboard/settings": {
    key: "settings",
    label: "Configuración",
    colorClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};

const DASHBOARD_MODULE: ModuleInfo = {
  key: "dashboard",
  label: "Dashboard",
  colorClass: "text-primary",
  dotClass: "bg-primary",
};

export function useModuleContext(): ModuleInfo {
  const { pathname } = useLocation();

  return useMemo(() => {
    // Find the most specific match (longest path)
    const match = Object.entries(MODULE_MAP)
      .filter(([path]) => pathname.startsWith(path))
      .sort((a, b) => b[0].length - a[0].length)[0];

    return match ? match[1] : DASHBOARD_MODULE;
  }, [pathname]);
}
