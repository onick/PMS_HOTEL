import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, BedDouble, BarChart3 } from "lucide-react";
import { RatePlansSettings } from "@/components/settings/RatePlansSettings";
import RevenueSettings from "@/components/revenue/RevenueSettings";
import CompetitorRates from "@/components/revenue/CompetitorRates";
import RateCalendar from "@/components/revenue/RateCalendar";
import { formatCurrencyAmount, normalizeCurrencyCode } from "@/lib/currency";

export default function Revenue() {
  const { hotel } = useOutletContext<{ hotel: { id: string; currency?: string } }>();
  const currencyCode = normalizeCurrencyCode(hotel?.currency);

  const { data: stats } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      const res = await api.getManagerDashboard();
      const data = res.data;

      return {
        totalRooms: data.today.arrivals_pending + data.today.departures_pending + data.today.in_house,
        occupiedRooms: data.today.in_house,
        occupancy: data.kpis_30d.avg_occupancy_rate,
        adr: data.kpis_30d.avg_adr_cents / 100,
        revpar: data.kpis_30d.avg_revpar_cents / 100,
        totalRevenue: data.kpis_30d.total_revenue_cents / 100,
        todayRevenue: data.today.revenue_cents / 100,
      };
    },
    enabled: !!hotel.id,
  });

  const kpis = [
    {
      title: "Ocupación (30d)",
      value: `${stats?.occupancy || 0}%`,
      subtitle: `${stats?.occupiedRooms || 0} en casa actualmente`,
      icon: BedDouble,
      color: "text-front-desk",
      bgColor: "bg-front-desk/10",
    },
    {
      title: "ADR (Tarifa Promedio)",
      value: formatCurrencyAmount(stats?.adr || 0, currencyCode),
      subtitle: "Average Daily Rate (30 días)",
      icon: DollarSign,
      color: "text-revenue",
      bgColor: "bg-revenue/10",
    },
    {
      title: "RevPAR",
      value: formatCurrencyAmount(stats?.revpar || 0, currencyCode),
      subtitle: "Revenue Per Available Room",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Revenue (30d)",
      value: formatCurrencyAmount(stats?.totalRevenue || 0, currencyCode),
      subtitle: `Hoy: ${formatCurrencyAmount(stats?.todayRevenue || 0, currencyCode)}`,
      icon: BarChart3,
      color: "text-billing",
      bgColor: "bg-billing/10",
    },
  ];

  return (
    <div className="space-y-6">
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
