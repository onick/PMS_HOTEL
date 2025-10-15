import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent, Users, Calendar } from "lucide-react";

export default function AnalyticsMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return null;

      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Reservas del mes actual
      const { data: currentMonthReservations } = await supabase
        .from("reservations")
        .select("total_amount_cents, guests, check_in, check_out, status")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("check_in", thisMonth.toISOString().split("T")[0])
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      // Reservas del mes anterior
      const { data: lastMonthReservations } = await supabase
        .from("reservations")
        .select("total_amount_cents, guests")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("check_in", lastMonth.toISOString().split("T")[0])
        .lte("check_in", lastMonthEnd.toISOString().split("T")[0])
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      // Total de habitaciones
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", userRoles.hotel_id);

      const totalRooms = rooms?.length || 1;

      // Calcular métricas mes actual
      const currentRevenue = currentMonthReservations?.reduce((sum, r) => sum + r.total_amount_cents, 0) || 0;
      const currentBookings = currentMonthReservations?.length || 0;
      
      // Calcular room nights vendidas
      const currentRoomNights = currentMonthReservations?.reduce((sum, r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0) || 1;

      // ADR (Average Daily Rate)
      const adr = currentRevenue / currentRoomNights / 100;

      // Ocupación estimada del mes
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const totalAvailableRoomNights = totalRooms * daysInMonth;
      const occupancyRate = (currentRoomNights / totalAvailableRoomNights) * 100;

      // RevPAR (Revenue Per Available Room)
      const revpar = (currentRevenue / 100) / (totalRooms * daysInMonth);

      // Métricas mes anterior
      const lastRevenue = lastMonthReservations?.reduce((sum, r) => sum + r.total_amount_cents, 0) || 1;
      const lastBookings = lastMonthReservations?.length || 1;

      // Variaciones
      const revenueChange = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
      const bookingsChange = ((currentBookings - lastBookings) / lastBookings) * 100;

      return {
        adr,
        revpar,
        occupancyRate,
        totalRevenue: currentRevenue / 100,
        totalBookings: currentBookings,
        revenueChange,
        bookingsChange,
      };
    },
  });

  const metricsData = [
    {
      title: "ADR (Tarifa Promedio)",
      value: `$${metrics?.adr.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Por noche vendida",
      trend: null,
    },
    {
      title: "RevPAR",
      value: `$${metrics?.revpar.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Ingreso por habitación disponible",
      trend: null,
    },
    {
      title: "Ocupación",
      value: `${metrics?.occupancyRate.toFixed(1) || "0"}%`,
      icon: Percent,
      color: "text-analytics",
      bgColor: "bg-analytics/10",
      description: "Del mes actual",
      trend: null,
    },
    {
      title: "Ingresos del Mes",
      value: `$${metrics?.totalRevenue.toFixed(0) || "0"}`,
      icon: Calendar,
      color: "text-billing",
      bgColor: "bg-billing/10",
      description: `${metrics?.revenueChange >= 0 ? "+" : ""}${metrics?.revenueChange.toFixed(1) || "0"}% vs mes anterior`,
      trend: metrics?.revenueChange,
    },
    {
      title: "Reservas del Mes",
      value: metrics?.totalBookings || 0,
      icon: Users,
      color: "text-channel-manager",
      bgColor: "bg-channel-manager/10",
      description: `${metrics?.bookingsChange >= 0 ? "+" : ""}${metrics?.bookingsChange.toFixed(1) || "0"}% vs mes anterior`,
      trend: metrics?.bookingsChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend !== null ? (metric.trend >= 0 ? TrendingUp : TrendingDown) : null;
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {TrendIcon && (
                  <TrendIcon className={`h-3 w-3 ${metric.trend! >= 0 ? "text-success" : "text-destructive"}`} />
                )}
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
