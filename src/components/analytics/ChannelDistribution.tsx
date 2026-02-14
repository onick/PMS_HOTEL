import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Network } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--channel-manager))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Directo",
  BOOKING: "Booking.com",
  EXPEDIA: "Expedia",
  AIRBNB: "Airbnb",
  WALKIN: "Walk-in",
  PHONE: "Teléfono",
  UNKNOWN: "Desconocido",
};

export default function ChannelDistribution() {
  const { data: channelData } = useQuery({
    queryKey: ["channel-distribution"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];

      const res = await api.getRevenueBySource(from, today);
      const data = res.data;

      return (data.data || []).map((item: any) => ({
        name: SOURCE_LABELS[item.source] || item.source,
        value: item.reservations_count,
        ingresos: item.total_revenue_cents / 100,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-analytics">
          <Network className="h-5 w-5" />
          Distribución por Canal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={channelData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {channelData?.map((_entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, _name: any, props: any) => [
              `${value} reservas ($${props.payload.ingresos.toFixed(2)})`,
              props.payload.name,
            ]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
