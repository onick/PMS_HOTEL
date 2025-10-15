import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, CreditCard } from "lucide-react";

export default function BillingStats() {
  const { data: stats } = useQuery({
    queryKey: ["billing-stats"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return null;

      // Obtener folios activos
      const { data: folios } = await supabase
        .from("folios")
        .select("balance_cents, currency")
        .eq("hotel_id", userRoles.hotel_id);

      // Obtener reservas del mes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: monthReservations } = await supabase
        .from("reservations")
        .select("total_amount_cents, status")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("created_at", startOfMonth.toISOString());

      const totalPending = folios?.reduce((sum, f) => sum + (f.balance_cents || 0), 0) || 0;
      const activeFolios = folios?.filter((f) => (f.balance_cents || 0) > 0).length || 0;
      
      const monthRevenue = monthReservations
        ?.filter((r) => r.status === "CHECKED_OUT" || r.status === "CHECKED_IN")
        .reduce((sum, r) => sum + r.total_amount_cents, 0) || 0;

      const confirmedBookings = monthReservations
        ?.filter((r) => r.status !== "CANCELLED" && r.status !== "EXPIRED").length || 0;

      return {
        totalPending: totalPending / 100,
        activeFolios,
        monthRevenue: monthRevenue / 100,
        confirmedBookings,
        currency: folios?.[0]?.currency || "USD",
      };
    },
  });

  const statsData = [
    {
      title: "Pendiente de Cobro",
      value: `$${stats?.totalPending.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      description: `${stats?.activeFolios || 0} folios activos`,
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats?.monthRevenue.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      description: stats?.currency || "USD",
    },
    {
      title: "Reservas Confirmadas",
      value: stats?.confirmedBookings || 0,
      icon: Receipt,
      color: "text-billing",
      bgColor: "bg-billing/10",
      description: "Este mes",
    },
    {
      title: "Folios Activos",
      value: stats?.activeFolios || 0,
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Con balance pendiente",
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
