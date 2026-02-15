import { useOutletContext } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Users,
  CalendarCheck,
  Home,
  Percent,
  Star,
  CheckCircle2,
  AlertCircle,
  LayoutGrid
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { format } from "date-fns";
import GuestsList from "@/components/crm/GuestsList";
import GuestDetails from "@/components/crm/GuestDetails";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export default function DashboardHome() {
  const { hotel } = useOutletContext<{ hotel: any }>();
  const { data, isLoading } = useDashboardMetrics(hotel.id);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [revenueTimeRange, setRevenueTimeRange] = useState<"7days" | "30days">("7days");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "MAINTENANCE",
    priority: "MEDIUM",
    due_date: "",
  });

  // Fetch pending tasks from Laravel API
  const { data: pendingTasks = [] } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const res = await api.getTasks({ status: "PENDING", per_page: "5" });
      return res.data ?? [];
    },
  });

  // Revenue chart data from sparkline
  const currentChartData = useMemo(() => {
    if (!data?.sparkline?.length) return [];

    const sparkline = data.sparkline;

    if (revenueTimeRange === "7days") {
      // Last 7 entries
      const last7 = sparkline.slice(-7);
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return last7.map((entry) => ({
        day: days[new Date(entry.date).getDay()],
        revenue: entry.revenue_cents / 100,
        occupancy: entry.occupancy || 0,
      }));
    } else {
      // All 30 days grouped by week
      const weeks = [];
      for (let i = 0; i < sparkline.length; i += 7) {
        const weekData = sparkline.slice(i, i + 7);
        const avgRevenue = weekData.reduce((sum, d) => sum + d.revenue_cents, 0) / weekData.length / 100;
        const avgOccupancy = weekData.reduce((sum, d) => sum + (d.occupancy || 0), 0) / weekData.length;
        weeks.push({
          week: `Sem ${Math.floor(i / 7) + 1}`,
          revenue: Math.round(avgRevenue),
          occupancy: Math.round(avgOccupancy * 10) / 10,
        });
      }
      return weeks;
    }
  }, [data?.sparkline, revenueTimeRange]);

  // Helper function for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: hotel.currency || "DOP",
    }).format(amount);
  };

  // Early return if loading
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general de las operaciones del hotel - {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ocupación"
          value={`${data.occupancyRate.toFixed(1)}%`}
          icon={Percent}
          description={`${data.occupied} de ${data.totalRooms} habitaciones`}
          trend={data.occupancyChange}
          trendLabel="vs mes anterior"
          accentColor="primary"
        />
        <StatCard
          title="Ingresos (30d)"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          description={`Hoy: ${formatCurrency(data.todayRevenue)}`}
          trend={data.revenueChange}
          trendLabel="vs mes anterior"
          accentColor="secondary"
        />
        <StatCard
          title="ADR (Tarifa Promedio)"
          value={formatCurrency(data.avgAdr)}
          icon={Home}
          description="Promedio últimos 30 días"
          accentColor="orange"
        />
        <StatCard
          title="RevPAR"
          value={formatCurrency(data.avgRevpar)}
          icon={TrendingUp}
          description="Revenue per Available Room"
          accentColor="blue"
        />
      </div>

      {/* Actividad del día - Layout 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Columna Izquierda - Actividad del día */}
        <div className="space-y-4">
          {/* Check-ins y Check-outs */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Check-ins hoy */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Check-ins Hoy</CardTitle>
                  <CardDescription>{data.todayArrivals} llegadas programadas</CardDescription>
                </div>
                <CalendarCheck className="h-5 w-5 text-housekeeping" />
              </CardHeader>
              <CardContent>
                {data.arrivalsDetail.length > 0 ? (
                  <div className="space-y-2">
                    {data.arrivalsDetail.slice(0, 5).map((res: any) => (
                      <div key={res.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{res.guest?.first_name} {res.guest?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{res.room_type?.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {res.adults + (res.children || 0)} {(res.adults + (res.children || 0)) === 1 ? 'huésped' : 'huéspedes'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay check-ins programados para hoy</p>
                )}
              </CardContent>
            </Card>

            {/* Check-outs hoy */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Check-outs Hoy</CardTitle>
                  <CardDescription>{data.todayDepartures} salidas programadas</CardDescription>
                </div>
                <Users className="h-5 w-5 text-front-desk" />
              </CardHeader>
              <CardContent>
                {data.departuresDetail.length > 0 ? (
                  <div className="space-y-2">
                    {data.departuresDetail.slice(0, 5).map((res: any) => (
                      <div key={res.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{res.guest?.first_name} {res.guest?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{res.room_type?.name}</p>
                        </div>
                        <span className="text-xs text-success font-medium">
                          {formatCurrency(res.total_cents / 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay check-outs programados para hoy</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Estado de reservas */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Estado Actual</CardTitle>
              <CardDescription>Distribución de habitaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success"></div>
                    <span className="text-sm">Ocupadas</span>
                  </div>
                  <span className="font-semibold text-success">{data.occupied}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Disponibles</span>
                  </div>
                  <span className="font-semibold text-blue-500">{data.vacant}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-warning"></div>
                    <span className="text-sm">In-House</span>
                  </div>
                  <span className="font-semibold text-warning">{data.inHouse}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold">{data.totalRooms}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend Chart */}
          <Card className="hover:shadow-md transition-shadow shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    Tendencia de Ingresos
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Ingresos diarios y ocupación
                  </CardDescription>
                </div>
                <Tabs value={revenueTimeRange} onValueChange={(v) => setRevenueTimeRange(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="7days" className="text-xs px-2">7 días</TabsTrigger>
                    <TabsTrigger value="30days" className="text-xs px-2">30 días</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {currentChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={currentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey={revenueTimeRange === "7days" ? "day" : "week"}
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : `${value}%`,
                          name === 'revenue' ? 'Ingresos' : 'Ocupación'
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="flex items-center justify-center gap-6 text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">Ingresos</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Sin datos de ingresos disponibles. Los datos aparecerán después de ejecutar la auditoría nocturna.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Overall Rating + Tasks */}
        <div className="space-y-4">
          {/* Overall Rating */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Overall Rating
              </CardTitle>
              <CardDescription>Calificación general del hotel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-yellow-500">4.8</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= 5 ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Basado en 127 reseñas</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Limpieza</span>
                    <span className="font-medium">4.9</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-medium">4.8</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Ubicación</span>
                    <span className="font-medium">4.7</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Comodidad</span>
                    <span className="font-medium">4.6</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/dashboard/front-desk")}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Front Desk
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/dashboard/reservations")}
              >
                <Users className="h-4 w-4 mr-2" />
                Reservaciones
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/dashboard/housekeeping")}
              >
                <Home className="h-4 w-4 mr-2" />
                Housekeeping
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/dashboard/tasks")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Tareas {pendingTasks.length > 0 ? `(${pendingTasks.length})` : ""}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de huéspedes */}
      <GuestsList onSelectGuest={setSelectedGuest} />

      {/* Detalles del huésped */}
      <GuestDetails
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
      />
    </div>
  );
}
