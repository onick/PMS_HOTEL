import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble, DollarSign } from "lucide-react";
import { formatCurrencyAmount, normalizeCurrencyCode } from "@/lib/currency";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--reservations))",
  "hsl(var(--housekeeping))",
  "hsl(var(--channel-manager))",
  "hsl(var(--analytics))",
  "hsl(var(--crm))",
];

export default function RevenueByRoomType() {
  const { data: hotelData } = useQuery({
    queryKey: ["hotel-currency"],
    queryFn: async () => (await api.getHotel()).data,
  });
  const currencyCode = normalizeCurrencyCode(hotelData?.currency);

  const { data: roomTypeRevenue, isLoading } = useQuery({
    queryKey: ["revenue-by-room-type"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];

      const res = await api.getRevenueByRoomType(from, today);
      const data = res.data;

      const chartData = (data.data || []).map((item: any) => ({
        name: item.room_type_name,
        revenue: item.total_revenue_cents / 100,
        revenueCents: item.total_revenue_cents,
        count: item.reservations_count,
        avgRateCents: item.avg_rate_cents,
        percentage: item.percentage,
      }));

      return {
        chartData,
        totalRevenue: data.summary.total_revenue_cents / 100,
        totalReservations: data.summary.total_reservations,
      };
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
              <BedDouble className="h-5 w-5 text-housekeeping" />
              Revenue por Tipo de Habitación
            </CardTitle>
            <CardDescription>
              Distribución de ingresos por categoría
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold">
              {formatCurrencyAmount(roomTypeRevenue?.totalRevenue || 0, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de pastel */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeRevenue?.chartData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {roomTypeRevenue?.chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Revenue: {formatCurrencyAmount(payload[0].payload.revenueCents / 100, currencyCode)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reservas: {payload[0].payload.count}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de estadísticas */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 text-sm font-semibold">Tipo</th>
                  <th className="text-right p-2 text-sm font-semibold">Reservas</th>
                  <th className="text-right p-2 text-sm font-semibold">ADR</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {roomTypeRevenue?.chartData.map((item: any, index: number) => (
                  <tr key={item.name} className="hover:bg-muted/30">
                    <td className="p-2 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {item.name}
                    </td>
                    <td className="p-2 text-right">{item.count}</td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrencyAmount(item.avgRateCents / 100, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen general */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {formatCurrencyAmount(roomTypeRevenue?.totalRevenue || 0, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">Revenue Total</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <BedDouble className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {roomTypeRevenue?.totalReservations || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Reservas</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {formatCurrencyAmount(
                (roomTypeRevenue?.totalRevenue || 0) / (roomTypeRevenue?.totalReservations || 1),
                currencyCode,
                "es-DO",
                { maximumFractionDigits: 0 },
              )}
            </div>
            <div className="text-xs text-muted-foreground">ADR Promedio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
