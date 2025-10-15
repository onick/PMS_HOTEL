import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Sparkles, AlertTriangle } from "lucide-react";

export default function DailyStats() {
  const { data: stats } = useQuery({
    queryKey: ["housekeeping-stats"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return null;

      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("status")
        .eq("hotel_id", userRoles.hotel_id);

      if (error) throw error;

      const total = rooms?.length || 0;
      const clean = rooms?.filter((r) => r.status === "AVAILABLE").length || 0;
      const dirty = rooms?.filter((r) => r.status === "MAINTENANCE").length || 0;
      const occupied = rooms?.filter((r) => r.status === "OCCUPIED").length || 0;
      const blocked = rooms?.filter((r) => r.status === "BLOCKED").length || 0;

      return {
        total,
        clean,
        dirty,
        occupied,
        blocked,
        cleanPercentage: total > 0 ? Math.round((clean / total) * 100) : 0,
      };
    },
  });

  const statsData = [
    {
      title: "Habitaciones Limpias",
      value: stats?.clean || 0,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Requieren Limpieza",
      value: stats?.dirty || 0,
      icon: Sparkles,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Ocupadas",
      value: stats?.occupied || 0,
      icon: Clock,
      color: "text-front-desk",
      bgColor: "bg-front-desk/10",
    },
    {
      title: "Bloqueadas",
      value: stats?.blocked || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              {stat.title === "Habitaciones Limpias" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.cleanPercentage}% del total
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
