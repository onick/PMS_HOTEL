import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrencyAmount, normalizeCurrencyCode } from "@/lib/currency";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--reservations))",
  "hsl(var(--housekeeping))",
  "hsl(var(--channel-manager))",
  "hsl(var(--analytics))",
  "hsl(var(--crm))",
];

interface RevenueByRoomTypeItem {
  name: string;
  revenue: number;
  revenueCents: number;
  count: number;
  avgRateCents: number;
}

interface RevenueByRoomTypeData {
  chartData: RevenueByRoomTypeItem[];
  totalRevenue: number;
  totalReservations: number;
}

export default function RevenueByRoomType() {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: hotelData } = useQuery({
    queryKey: ["hotel-currency"],
    queryFn: async () => (await api.getHotel()).data,
  });

  const currencyCode = normalizeCurrencyCode(hotelData?.currency);

  const { data: roomTypeRevenue, isLoading } = useQuery<RevenueByRoomTypeData>({
    queryKey: ["revenue-by-room-type"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];

      const res = await api.getRevenueByRoomType(from, today);
      const data = res.data;

      const chartData: RevenueByRoomTypeItem[] = (data.data || []).map((item: any) => ({
        name: item.room_type_name,
        revenue: item.total_revenue_cents / 100,
        revenueCents: item.total_revenue_cents,
        count: item.reservations_count,
        avgRateCents: item.avg_rate_cents,
      }));

      return {
        chartData,
        totalRevenue: data.summary.total_revenue_cents / 100,
        totalReservations: data.summary.total_reservations,
      };
    },
  });

  const rankingData = useMemo(() => {
    const items = roomTypeRevenue?.chartData || [];
    const totalRevenueCents = items.reduce((sum, item) => sum + item.revenueCents, 0);

    return [...items]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .map((item) => ({
        ...item,
        share: totalRevenueCents > 0 ? (item.revenueCents / totalRevenueCents) * 100 : 0,
      }));
  }, [roomTypeRevenue?.chartData]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rankingData.length]);

  const activeSlice = rankingData[activeIndex] || rankingData[0] || null;
  const shouldShowDonutLabels =
    rankingData.filter((item) => item.share >= 6).length >= 2;

  const renderDonutLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent } = props;
    if (!shouldShowDonutLabels) return null;
    if (!percent || percent < 0.06) return null;

    const RADIAN = Math.PI / 180;
    const radius = (outerRadius || 0) + 16;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-housekeeping" />
              Revenue por Tipo de Habitación
            </CardTitle>
            <CardDescription>
              Distribución y rendimiento comercial por categoría
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold">
              {formatCurrencyAmount(roomTypeRevenue?.totalRevenue || 0, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="relative rounded-lg border bg-muted/20 p-3">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={rankingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={112}
                  paddingAngle={2}
                  dataKey="revenue"
                  labelLine={false}
                  label={renderDonutLabel}
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {rankingData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      opacity={activeIndex === index ? 1 : 0.72}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {activeSlice && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-3xl font-bold leading-none">
                    {activeSlice.share.toFixed(1)}%
                  </p>
                  <p
                    className="text-sm font-medium mt-2 truncate max-w-[180px]"
                    title={activeSlice.name}
                  >
                    {activeSlice.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrencyAmount(activeSlice.revenueCents / 100, currencyCode)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-sm font-semibold">Ranking por Revenue</p>
              <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-3 space-y-3">
              {rankingData.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No hay datos por tipo de habitación.
                </div>
              )}

              {rankingData.map((item, index) => (
                <div key={item.name} className="rounded-md border p-3 bg-background/70">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center text-white" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </div>
                        <p className="font-medium truncate">{item.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.count} reservas • ADR {formatCurrencyAmount(item.avgRateCents / 100, currencyCode)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatCurrencyAmount(item.revenueCents / 100, currencyCode)}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.share.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(item.share, 2)}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Revenue Total</span>
            </div>
            <div className="text-xl font-bold">
              {formatCurrencyAmount(roomTypeRevenue?.totalRevenue || 0, currencyCode, "es-DO", { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BedDouble className="h-4 w-4" />
              <span className="text-xs">Total Reservas</span>
            </div>
            <div className="text-xl font-bold">
              {roomTypeRevenue?.totalReservations || 0}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">ADR Global</span>
            </div>
            <div className="text-xl font-bold">
              {formatCurrencyAmount(
                (roomTypeRevenue?.totalRevenue || 0) / (roomTypeRevenue?.totalReservations || 1),
                currencyCode,
                "es-DO",
                { maximumFractionDigits: 0 },
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
