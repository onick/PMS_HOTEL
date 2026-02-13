import { useChannelStats } from "@/hooks/useChannels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wifi,
  ArrowDownLeft,
  Package,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelStats() {
  const { data: stats, isLoading } = useChannelStats();

  const statCards = [
    {
      title: "Canales Activos",
      value: stats?.total_active_channels ?? 0,
      subtitle: `${stats?.total_channels ?? 0} total configurados`,
      icon: Wifi,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Reservas por OTA (30d)",
      value: stats?.reservations_by_source_30d
        ?.filter((s) => s.source !== "DIRECT")
        .reduce((sum, s) => sum + s.count, 0) ?? 0,
      subtitle: "Desde canales conectados",
      icon: ArrowDownLeft,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Outbox Pendiente",
      value: stats?.pending_outbox ?? 0,
      subtitle: "Items por enviar a OTAs",
      icon: Package,
      color: stats?.pending_outbox && stats.pending_outbox > 0
        ? "text-amber-600"
        : "text-slate-500",
      bgColor: stats?.pending_outbox && stats.pending_outbox > 0
        ? "bg-amber-500/10"
        : "bg-slate-500/10",
    },
    {
      title: "Errores Recientes",
      value: stats?.recent_logs?.filter((l) => l.status === "FAILED").length ?? 0,
      subtitle: "En las últimas 24h",
      icon: AlertCircle,
      color: (stats?.recent_logs?.filter((l) => l.status === "FAILED").length ?? 0) > 0
        ? "text-red-600"
        : "text-slate-500",
      bgColor: (stats?.recent_logs?.filter((l) => l.status === "FAILED").length ?? 0) > 0
        ? "bg-red-500/10"
        : "bg-slate-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
