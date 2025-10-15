import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useOutletContext } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, TrendingUp } from "lucide-react";

export default function RevenueByChannel() {
  const { hotel } = useOutletContext<{ hotel: { id: string; currency: string } }>();

  const { data: channelRevenue, isLoading } = useQuery({
    queryKey: ["revenue-by-channel", hotel.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("total_amount_cents, metadata, status")
        .eq("hotel_id", hotel.id)
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      if (error) throw error;

      // Agrupar por canal
      const channelMap = new Map<string, number>();
      
      data?.forEach((reservation) => {
        const metadata = reservation.metadata as any;
        const channel = metadata?.source || "Direct";
        const amount = reservation.total_amount_cents || 0;
        channelMap.set(channel, (channelMap.get(channel) || 0) + amount);
      });

      // Convertir a array y ordenar
      const chartData = Array.from(channelMap.entries())
        .map(([channel, totalCents]) => ({
          channel,
          revenue: totalCents / 100,
          revenueFormatted: new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: hotel.currency,
          }).format(totalCents / 100),
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: hotel.currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              {formatCurrency(channelRevenue?.totalRevenue || 0)}
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{payload[0].payload.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {payload[0].payload.revenueFormatted}
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
              {channelRevenue?.chartData.map((item) => (
                <tr key={item.channel} className="hover:bg-muted/30">
                  <td className="p-3">{item.channel}</td>
                  <td className="p-3 text-right font-medium">
                    {item.revenueFormatted}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {((item.revenue / (channelRevenue.totalRevenue || 1)) * 100).toFixed(1)}%
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
