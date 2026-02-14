import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Network } from "lucide-react";
import { formatCurrencyAmount, normalizeCurrencyCode } from "@/lib/currency";

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Directo",
  BOOKING: "Booking.com",
  EXPEDIA: "Expedia",
  AIRBNB: "Airbnb",
  WALKIN: "Walk-in",
  PHONE: "Teléfono",
  UNKNOWN: "Desconocido",
};

export default function RevenueByChannel() {
  const { data: hotelData } = useQuery({
    queryKey: ["hotel-currency"],
    queryFn: async () => (await api.getHotel()).data,
  });
  const currencyCode = normalizeCurrencyCode(hotelData?.currency);

  const { data: channelRevenue, isLoading } = useQuery({
    queryKey: ["revenue-by-channel"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];

      const res = await api.getRevenueBySource(from, today);
      const data = res.data;

      const chartData = (data.data || []).map((item: any) => ({
        channel: SOURCE_LABELS[item.source] || item.source,
        revenue: item.total_revenue_cents / 100,
        revenueCents: item.total_revenue_cents,
        percentage: item.percentage_revenue,
      }));

      const totalRevenue = data.summary.total_revenue_cents / 100;

      return { chartData, totalRevenue };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-channel-manager" />
              Revenue por Canal de Distribución
            </CardTitle>
            <CardDescription>
              Análisis de ingresos por fuente de reservas
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold">
              {formatCurrencyAmount(channelRevenue?.totalRevenue || 0, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={channelRevenue?.chartData || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="channel"
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tickFormatter={(value) => formatCurrencyAmount(value, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{payload[0].payload.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {formatCurrencyAmount(payload[0].payload.revenueCents / 100, currencyCode)}
                    </p>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--channel-manager))"
              name="Revenue"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Tabla de detalles */}
        <div className="mt-6 border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold">Canal</th>
                <th className="text-right p-3 font-semibold">Revenue</th>
                <th className="text-right p-3 font-semibold">% Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {channelRevenue?.chartData.map((item: any) => (
                <tr key={item.channel} className="hover:bg-muted/30">
                  <td className="p-3">{item.channel}</td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrencyAmount(item.revenueCents / 100, currencyCode)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
