import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Percent, BedDouble, BarChart3, Globe } from "lucide-react";
import { RatePlansSettings } from "@/components/settings/RatePlansSettings";
import RevenueSettings from "@/components/revenue/RevenueSettings";
import CompetitorRates from "@/components/revenue/CompetitorRates";
import RateCalendar from "@/components/revenue/RateCalendar";

export default function Revenue() {
  const { hotel } = useOutletContext<{ hotel: { id: string; currency?: string } }>();

  const { data: stats } = useQuery({
    queryKey: ["revenue-stats", hotel.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      // Total rooms
      const { count: totalRooms } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", hotel.id);

      // Occupied rooms
      const { count: occupiedRooms } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", hotel.id)
        .eq("status", "OCCUPIED");

      // Reservations this month for ADR
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: monthReservations } = await supabase
        .from("reservations")
        .select("total_amount_cents, check_in, check_out")
        .eq("hotel_id", hotel.id)
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"])
        .gte("check_in", monthStart.toISOString().split("T")[0]);

      const totalRevenue = monthReservations?.reduce(
        (sum, r) => sum + r.total_amount_cents, 0
      ) || 0;

      const totalNights = monthReservations?.reduce((sum, r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        return sum + nights;
      }, 0) || 0;

      const occupancy = totalRooms ? Math.round(((occupiedRooms || 0) / totalRooms) * 100) : 0;
      const adr = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0;
      const revpar = totalRooms ? Math.round((totalRevenue / 100) / totalRooms) : 0;

      // Active rate plans
      const { count: activePlans } = await supabase
        .from("rate_plans")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", hotel.id)
        .eq("is_active", true);

      return {
        totalRooms: totalRooms || 0,
        occupiedRooms: occupiedRooms || 0,
        occupancy,
        adr: adr / 100,
        revpar,
        totalRevenue: totalRevenue / 100,
        totalReservations: monthReservations?.length || 0,
        activePlans: activePlans || 0,
      };
    },
    enabled: !!hotel.id,
  });

  const currency = hotel.currency || "USD";

  const kpis = [
    {
      title: "Ocupación Actual",
      value: `${stats?.occupancy || 0}%`,
      subtitle: `${stats?.occupiedRooms || 0} de ${stats?.totalRooms || 0} habitaciones`,
      icon: BedDouble,
      color: "text-front-desk",
      bgColor: "bg-front-desk/10",
    },
    {
      title: "ADR (Tarifa Promedio)",
      value: `$${stats?.adr?.toFixed(2) || "0.00"}`,
      subtitle: "Average Daily Rate este mes",
      icon: DollarSign,
      color: "text-revenue",
      bgColor: "bg-revenue/10",
    },
    {
      title: "RevPAR",
      value: `$${stats?.revpar?.toFixed(2) || "0.00"}`,
      subtitle: "Revenue Per Available Room",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Revenue del Mes",
      value: `$${stats?.totalRevenue?.toLocaleString() || "0"}`,
      subtitle: `${stats?.totalReservations || 0} reservas`,
      icon: BarChart3,
      color: "text-billing",
      bgColor: "bg-billing/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Revenue Management</h1>
        <p className="text-muted-foreground">
          Gestión de tarifas, pricing dinámico y análisis de competencia
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendario de Tarifas</TabsTrigger>
          <TabsTrigger value="plans">Planes de Tarifas</TabsTrigger>
          <TabsTrigger value="competitors">Competencia</TabsTrigger>
          <TabsTrigger value="settings">Pricing Dinámico</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <RateCalendar hotelId={hotel.id} />
        </TabsContent>

        <TabsContent value="plans">
          <RatePlansSettings />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorRates hotelId={hotel.id} />
        </TabsContent>

        <TabsContent value="settings">
          <RevenueSettings hotelId={hotel.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
