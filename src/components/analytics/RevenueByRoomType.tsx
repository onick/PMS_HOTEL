import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { useOutletContext } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble, DollarSign } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--reservations))",
  "hsl(var(--housekeeping))",
  "hsl(var(--channel-manager))",
  "hsl(var(--analytics))",
  "hsl(var(--crm))",
];

export default function RevenueByRoomType() {
  const { hotel } = useOutletContext<{ hotel: { id: string; currency: string } }>();

  const { data: roomTypeRevenue, isLoading } = useQuery({
    queryKey: ["revenue-by-room-type", hotel.id],
    queryFn: async () => {
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select(`
          total_amount_cents,
          status,
          room_type_id,
          room_types (
            name
          )
        `)
        .eq("hotel_id", hotel.id)
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      if (error) throw error;

      // Agrupar por tipo de habitación
      const typeMap = new Map<string, { revenue: number; count: number }>();
      
      reservations?.forEach((reservation: any) => {
        const typeName = reservation.room_types?.name || "Sin especificar";
        const amount = reservation.total_amount_cents || 0;
        const current = typeMap.get(typeName) || { revenue: 0, count: 0 };
        
        typeMap.set(typeName, {
          revenue: current.revenue + amount,
          count: current.count + 1,
        });
      });

      // Convertir a array
      const chartData = Array.from(typeMap.entries())
        .map(([name, data]) => ({
          name,
          revenue: data.revenue / 100,
          count: data.count,
          avgRevenue: data.revenue / 100 / data.count,
          revenueFormatted: new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: hotel.currency,
          }).format(data.revenue / 100),
          avgRevenueFormatted: new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: hotel.currency,
          }).format(data.revenue / 100 / data.count),
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
      const totalReservations = chartData.reduce((sum, item) => sum + item.count, 0);

      return { chartData, totalRevenue, totalReservations };
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
              {formatCurrency(roomTypeRevenue?.totalRevenue || 0)}
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
                  {roomTypeRevenue?.chartData.map((entry, index) => (
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
                          Revenue: {payload[0].payload.revenueFormatted}
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
                {roomTypeRevenue?.chartData.map((item, index) => (
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
                      {item.avgRevenueFormatted}
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
              {formatCurrency(roomTypeRevenue?.totalRevenue || 0)}
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
              {formatCurrency(
                (roomTypeRevenue?.totalRevenue || 0) / (roomTypeRevenue?.totalReservations || 1)
              )}
            </div>
            <div className="text-xs text-muted-foreground">ADR Promedio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
