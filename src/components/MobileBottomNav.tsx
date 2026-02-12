import { NavLink, useLocation } from "react-router-dom";
import { Home, Hotel, CalendarDays, BedDouble, MoreHorizontal } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Inicio", end: true },
  { to: "/dashboard/front-desk", icon: Hotel, label: "Front Desk" },
  { to: "/dashboard/reservations", icon: CalendarDays, label: "Reservas" },
  { to: "/dashboard/housekeeping", icon: BedDouble, label: "Limpieza" },
];

export function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card/95 backdrop-blur-sm border-t border-border/60 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const active = isActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] active:scale-95 transition-transform"
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight transition-colors",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}

        {/* More button - opens sidebar sheet */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] active:scale-95 transition-transform"
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] leading-tight text-muted-foreground">
            Más
          </span>
        </button>
      </div>
    </nav>
  );
}
