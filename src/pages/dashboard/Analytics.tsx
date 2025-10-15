import AnalyticsMetrics from "@/components/analytics/AnalyticsMetrics";
import OccupancyChart from "@/components/analytics/OccupancyChart";
import RevenueChart from "@/components/analytics/RevenueChart";
import ChannelDistribution from "@/components/analytics/ChannelDistribution";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics e Inteligencia de Negocios</h1>
        <p className="text-muted-foreground">
          Reportes, métricas y análisis de rendimiento
        </p>
      </div>

      <AnalyticsMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart />
        <RevenueChart />
      </div>

      <ChannelDistribution />
    </div>
  );
}
