import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, CreditCard } from "lucide-react";
import { formatCurrencyFromCents, normalizeCurrencyCode } from "@/lib/currency";

export default function BillingStats() {
  const { data: stats } = useQuery({
    queryKey: ["billing-stats"],
    queryFn: async () => {
      const res = await api.getBillingStats();
      return res.data;
    },
  });

  const currencyCode = normalizeCurrencyCode(stats?.currency);

  const formatCurrency = (cents: number) => formatCurrencyFromCents(cents, currencyCode);

  const statsData = [
    {
      title: "Pendiente de Cobro",
      value: formatCurrency(stats?.total_pending_cents || 0),
      icon: DollarSign,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      description: `${stats?.active_folios_count || 0} folios activos`,
    },
    {
      title: "Ingresos del Mes",
      value: formatCurrency(stats?.month_revenue_cents || 0),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      description: currencyCode,
    },
    {
      title: "Reservas Confirmadas",
      value: stats?.confirmed_bookings || 0,
      icon: Receipt,
      color: "text-billing",
      bgColor: "bg-billing/10",
      description: "Este mes",
    },
    {
      title: "Folios Activos",
      value: stats?.active_folios_count || 0,
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
