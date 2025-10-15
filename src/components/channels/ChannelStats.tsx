import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Percent } from "lucide-react";

export default function ChannelStats() {
  const { data: stats } = useQuery({
    queryKey: ["channel-stats"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return null;

      const { data: reservations } = await supabase
        .from("reservations")
        .select("total_amount_cents, metadata, status")
        .eq("hotel_id", userRoles.hotel_id);

      const totalReservations = reservations?.length || 0;
      const channelReservations = reservations?.filter(
        (r) => r.metadata && typeof r.metadata === 'object' && 'channel' in r.metadata
      ).length || 0;
      const directReservations = totalReservations - channelReservations;

      const channelRevenue = reservations
        ?.filter((r) => r.metadata && typeof r.metadata === 'object' && 'channel' in r.metadata && r.status !== "CANCELLED")
        .reduce((sum, r) => sum + r.total_amount_cents, 0) || 0;

      const directRevenue = reservations
        ?.filter((r) => (!r.metadata || typeof r.metadata !== 'object' || !('channel' in r.metadata)) && r.status !== "CANCELLED")
        .reduce((sum, r) => sum + r.total_amount_cents, 0) || 0;

      const totalRevenue = channelRevenue + directRevenue;

      return {
        totalReservations,
        channelReservations,
        directReservations,
        channelPercentage: totalReservations > 0 
          ? Math.round((channelReservations / totalReservations) * 100) 
          : 0,
        channelRevenue: channelRevenue / 100,
        directRevenue: directRevenue / 100,
        totalRevenue: totalRevenue / 100,
      };
    },
  });

  const statsData = [
    {
      title: "Reservas por Canales",
      value: stats?.channelReservations || 0,
      icon: Users,
      color: "text-channel-manager",
      bgColor: "bg-channel-manager/10",
      description: `${stats?.channelPercentage || 0}% del total`,
    },
    {
      title: "Reservas Directas",
      value: stats?.directReservations || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: `${100 - (stats?.channelPercentage || 0)}% del total`,
    },
    {
      title: "Ingresos por Canales",
      value: `$${stats?.channelRevenue.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Total acumulado",
    },
    {
      title: "Ingresos Directos",
      value: `$${stats?.directRevenue.toFixed(2) || "0.00"}`,
      icon: Percent,
      color: "text-billing",
      bgColor: "bg-billing/10",
      description: "Total acumulado",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
