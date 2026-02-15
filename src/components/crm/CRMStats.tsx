import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, TrendingUp, Calendar } from "lucide-react";

export default function CRMStats() {
  const { data: stats } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: async () => {
      const firstPage = await api.getGuests({ per_page: "100", page: "1" });
      const totalPages = Number(firstPage?.meta?.last_page || 1);

      let guests: any[] = firstPage?.data || [];

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.getGuests({ per_page: "100", page: String(index + 2) }),
          ),
        );

        guests = [
          ...guests,
          ...remainingPages.flatMap((page) => page?.data || []),
        ];
      }

      const totalGuests = guests.length;
      const vipGuests = guests.filter((g) => !!g.vip_level).length;
      const repeatGuests = guests.filter((g) => (g.total_stays || 0) > 1).length;

      const avgLifetimeValue = totalGuests > 0
        ? guests.reduce((sum, g) => sum + (g.total_spent_cents || 0), 0) / totalGuests / 100
        : 0;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newGuestsThisMonth = guests.filter(
        (g) => new Date(g.created_at) >= thisMonth
      ).length;

      return {
        totalGuests,
        vipGuests,
        repeatGuests,
        avgLifetimeValue,
        newGuestsThisMonth,
        repeatRate: totalGuests > 0 ? Math.round((repeatGuests / totalGuests) * 100) : 0,
      };
    },
  });

  const statsData = [
    {
      title: "Total de Huéspedes",
      value: stats?.totalGuests || 0,
      icon: Users,
      color: "text-crm",
      bgColor: "bg-crm/10",
      description: `${stats?.newGuestsThisMonth || 0} nuevos este mes`,
    },
    {
      title: "Huéspedes VIP",
      value: stats?.vipGuests || 0,
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
      description: "Clientes premium",
    },
    {
      title: "Tasa de Retención",
      value: `${stats?.repeatRate || 0}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      description: `${stats?.repeatGuests || 0} huéspedes recurrentes`,
    },
    {
      title: "Valor Promedio",
      value: `$${stats?.avgLifetimeValue?.toFixed(0) || 0}`,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Lifetime value",
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
