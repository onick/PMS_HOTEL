import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent, Users, Calendar } from "lucide-react";

export default function AnalyticsMetrics() {
  const { data: dashboard } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: async () => {
      const res = await api.getManagerDashboard();
      return res.data;
    },
  });

  const metricsData = [
    {
      title: "ADR (Tarifa Promedio)",
      value: `$${dashboard?.kpis_30d.avg_adr || "0.00"}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Promedio últimos 30 días",
      trend: dashboard?.trends.adr_direction === "up" ? 1 : dashboard?.trends.adr_direction === "down" ? -1 : null,
    },
    {
      title: "RevPAR",
      value: `$${dashboard?.kpis_30d.avg_revpar || "0.00"}`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Ingreso por habitación disponible",
      trend: null,
    },
    {
      title: "Ocupación",
      value: `${dashboard?.kpis_30d.avg_occupancy_rate || 0}%`,
      icon: Percent,
      color: "text-analytics",
      bgColor: "bg-analytics/10",
      description: "Promedio últimos 30 días",
      trend: dashboard?.trends.occupancy_direction === "up" ? 1 : dashboard?.trends.occupancy_direction === "down" ? -1 : null,
    },
    {
      title: "Ingresos (30d)",
      value: `$${dashboard?.kpis_30d.total_revenue || "0.00"}`,
      icon: Calendar,
      color: "text-billing",
      bgColor: "bg-billing/10",
      description: dashboard?.trends.revenue_direction === "up" ? "Tendencia al alza" : "Tendencia a la baja",
      trend: dashboard?.trends.revenue_direction === "up" ? 1 : -1,
    },
    {
      title: "Hoy",
      value: `${dashboard?.today.arrivals_pending || 0} llegadas`,
      icon: Users,
      color: "text-channel-manager",
      bgColor: "bg-channel-manager/10",
      description: `${dashboard?.today.in_house || 0} en casa, ${dashboard?.today.departures_pending || 0} salidas`,
      trend: null,
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
