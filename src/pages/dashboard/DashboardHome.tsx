import { useOutletContext } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CalendarCheck,
  Home,
  Clock,
  Percent,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { format } from "date-fns";
import GuestsList from "@/components/crm/GuestsList";
import GuestDetails from "@/components/crm/GuestDetails";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

interface DashboardMetrics {
  totalReservations: number;
  confirmedReservations: number;
  pendingPayment: number;
  totalRevenue: number;
  averageRate: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  revenueChange: number;
  occupancyChange: number;
}

export default function DashboardHome() {
  const { hotel } = useOutletContext<{ hotel: any }>();
  const { data, isLoading } = useDashboardMetrics(hotel.id);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [revenueTimeRange, setRevenueTimeRange] = useState<"today" | "7days" | "30days">("7days");
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

  // Fetch pending tasks
  const { data: tasks } = useQuery({
    queryKey: ["dashboard-tasks", hotel.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("*, rooms(room_number)")
        .eq("hotel_id", hotel.id)
        .in("status", ["PENDING", "IN_PROGRESS"])
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation to complete a task
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      toast.success("Tarea completada");
    },
    onError: () => {
      toast.error("Error al completar la tarea");
    },
  });

  // Mutation to create a task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("tasks")
        .insert({
          hotel_id: hotel.id,
          title: taskData.title,
          description: taskData.description,
          task_type: taskData.task_type,
          priority: taskData.priority,
          due_date: taskData.due_date || null,
          status: "PENDING",
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      toast.success("Tarea creada exitosamente");
      setCreateTaskDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        task_type: "MAINTENANCE",
        priority: "MEDIUM",
        due_date: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear la tarea");
    },
  });

  const metrics = useMemo<DashboardMetrics>(() => {
    if (!data) {
      return {
        totalReservations: 0,
        confirmedReservations: 0,
        pendingPayment: 0,
        totalRevenue: 0,
        averageRate: 0,
        occupancyRate: 0,
        totalRooms: 0,
        occupiedToday: 0,
        checkInsToday: 0,
        checkOutsToday: 0,
        revenueChange: 0,
        occupancyChange: 0,
      };
    }

    const { allReservations, totalRooms, activeToday, checkInsToday, checkOutsToday, monthlyStats } = data;

    const confirmed = allReservations.filter((r) => r.status === 'CONFIRMED');
    const pending = allReservations.filter((r) => r.status === 'PENDING_PAYMENT');

    const totalRevenue = confirmed.reduce((sum, r) => sum + r.total_amount_cents / 100, 0);
    const avgRate = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;
    const occupancyRate = totalRooms ? (activeToday.length / totalRooms) * 100 : 0;

    return {
      totalReservations: allReservations.length,
      confirmedReservations: confirmed.length,
      pendingPayment: pending.length,
      totalRevenue,
      averageRate: avgRate,
      occupancyRate,
      totalRooms,
      occupiedToday: activeToday.length,
      checkInsToday: checkInsToday.length,
      checkOutsToday: checkOutsToday.length,
      revenueChange: monthlyStats?.revenueChange || 0,
      occupancyChange: monthlyStats?.occupancyChange || 0,
    };
  }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: hotel.currency || "DOP",
    }).format(amount);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const upcomingCheckIns = data?.checkInsToday || [];
  const upcomingCheckOuts = data?.checkOutsToday || [];

  // Query para datos de Revenue Management (historial de precios)
  const { data: revenueData } = useQuery({
    queryKey: ["revenue-data", hotel.id, revenueTimeRange],
    queryFn: async () => {
      const today = new Date();
      let startDate: Date;
      let endDate: Date = today;

      if (revenueTimeRange === "today") {
        startDate = today;
      } else if (revenueTimeRange === "7days") {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
      } else {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
      }

      // Obtener historial de precios del hotel
      const { data: rateHistory, error: rateError } = await supabase
        .from("rate_history")
        .select("date, price_cents, room_types(name)")
        .eq("hotel_id", hotel.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (rateError) throw rateError;

      // Obtener tarifas de competidores
      const { data: competitorRates, error: compError } = await supabase
        .from("competitor_rates")
        .select("date, price_cents")
        .eq("hotel_id", hotel.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (compError) throw compError;

      return { rateHistory, competitorRates, startDate, endDate };
    },
  });

  // Query para tarifa óptima
  const { data: optimalRateData } = useQuery({
    queryKey: ["optimal-rate", hotel.id],
    queryFn: async () => {
      // Obtener el primer room_type del hotel
      const { data: roomTypes } = await supabase
        .from("room_types")
        .select("id")
        .eq("hotel_id", hotel.id)
        .limit(1)
        .single();

      if (!roomTypes) return null;

      const { data, error } = await supabase.rpc("calculate_optimal_rate", {
        p_hotel_id: hotel.id,
        p_room_type_id: roomTypes.id,
        p_date: new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("Error calculating optimal rate:", error);
        return null;
      }

      return data;
    },
  });

  // Procesar datos del gráfico
  const currentChartData = useMemo(() => {
    if (!revenueData?.rateHistory) return [];

    const { rateHistory, competitorRates } = revenueData;

    // Agrupar datos por fecha
    const dataByDate = new Map();

    rateHistory.forEach((rate: any) => {
      const date = rate.date;
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { date, hotelRate: 0, count: 0 });
      }
      const entry = dataByDate.get(date);
      entry.hotelRate += rate.price_cents / 100;
      entry.count += 1;
    });

    // Calcular promedio por fecha
    dataByDate.forEach((entry) => {
      entry.hotelRate = entry.count > 0 ? entry.hotelRate / entry.count : 0;
    });

    // Agregar datos de competidores
    competitorRates?.forEach((rate: any) => {
      const date = rate.date;
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { date, hotelRate: 0, competitorRate: 0 });
      }
      const entry = dataByDate.get(date);
      entry.competitorRate = (entry.competitorRate || 0) + rate.price_cents / 100;
    });

    // Convertir a array y formatear según el rango de tiempo
    const chartData = Array.from(dataByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (revenueTimeRange === "today") {
      // Para hoy, dividir en franjas horarias (simulado por ahora)
      return [
        { time: "8am", hotelRate: chartData[0]?.hotelRate || 0, competitorRate: chartData[0]?.competitorRate || 0 },
        { time: "12pm", hotelRate: chartData[0]?.hotelRate || 0, competitorRate: chartData[0]?.competitorRate || 0 },
        { time: "4pm", hotelRate: chartData[0]?.hotelRate || 0, competitorRate: chartData[0]?.competitorRate || 0 },
        { time: "8pm", hotelRate: chartData[0]?.hotelRate || 0, competitorRate: chartData[0]?.competitorRate || 0 },
      ];
    } else if (revenueTimeRange === "7days") {
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return chartData.map((entry) => ({
        day: days[new Date(entry.date).getDay()],
        hotelRate: entry.hotelRate,
        competitorRate: entry.competitorRate || entry.hotelRate * 1.05,
      }));
    } else {
      // 30 días - agrupar por semana
      const weeks = [];
      for (let i = 0; i < chartData.length; i += 7) {
        const weekData = chartData.slice(i, i + 7);
        const avgHotelRate = weekData.reduce((sum, d) => sum + d.hotelRate, 0) / weekData.length;
        const avgCompRate = weekData.reduce((sum, d) => sum + (d.competitorRate || 0), 0) / weekData.length;
        weeks.push({
          week: `Sem ${Math.floor(i / 7) + 1}`,
          hotelRate: avgHotelRate,
          competitorRate: avgCompRate || avgHotelRate * 1.05,
        });
      }
      return weeks;
    }
  }, [revenueData, revenueTimeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-muted-foreground">
          Resumen general de las operaciones del hotel - {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Ocupación */}
        <Card className="hover-scale border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metrics.occupancyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.occupiedToday} de {metrics.totalRooms} habitaciones
            </p>
            <div className="flex items-center mt-2 text-xs">
              {metrics.occupancyChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={metrics.occupancyChange >= 0 ? "text-success" : "text-destructive"}>
                {metrics.occupancyChange >= 0 ? "+" : ""}{metrics.occupancyChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos totales */}
        <Card className="hover-scale border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.confirmedReservations} reservas confirmadas
            </p>
            <div className="flex items-center mt-2 text-xs">
              {metrics.revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span className={metrics.revenueChange >= 0 ? "text-success" : "text-destructive"}>
                {metrics.revenueChange >= 0 ? "+" : ""}{metrics.revenueChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* ADR (Tarifa Promedio) */}
        <Card className="hover-scale border-billing/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ADR (Tarifa Promedio)</CardTitle>
            <Home className="h-4 w-4 text-billing" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-billing">
              {formatCurrency(metrics.averageRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por reserva confirmada
            </p>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Actualizado en tiempo real
            </div>
          </CardContent>
        </Card>

        {/* RevPAR */}
        <Card className="hover-scale border-analytics/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
            <TrendingUp className="h-4 w-4 text-analytics" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-analytics">
              {formatCurrency((metrics.averageRate * metrics.occupancyRate) / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue per Available Room
            </p>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              ADR × Ocupación
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad del día - Layout 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Columna Izquierda - Actividad del día */}
        <div className="space-y-4">
          {/* Check-ins y Check-outs */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Check-ins hoy */}
            <Card className="border-housekeeping/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Check-ins Hoy</CardTitle>
                  <CardDescription>{metrics.checkInsToday} llegadas programadas</CardDescription>
                </div>
                <CalendarCheck className="h-5 w-5 text-housekeeping" />
              </CardHeader>
              <CardContent>
                {upcomingCheckIns.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingCheckIns.map((res) => (
                      <div key={res.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{res.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{res.room_types?.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {res.guests} {res.guests === 1 ? 'huésped' : 'huéspedes'}
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
            <Card className="border-front-desk/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Check-outs Hoy</CardTitle>
                  <CardDescription>{metrics.checkOutsToday} salidas programadas</CardDescription>
                </div>
                <Users className="h-5 w-5 text-front-desk" />
              </CardHeader>
              <CardContent>
                {upcomingCheckOuts.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingCheckOuts.map((res) => (
                      <div key={res.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{res.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{res.room_types?.name}</p>
                        </div>
                        <span className="text-xs text-success font-medium">
                          {formatCurrency(res.total_amount_cents / 100)}
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

          {/* Estado de reservas - Ancho completo dentro de columna izquierda */}
          <Card className="border-reservations/20">
            <CardHeader>
              <CardTitle className="text-lg">Estado de Reservas</CardTitle>
              <CardDescription>Distribución actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success"></div>
                    <span className="text-sm">Confirmadas</span>
                  </div>
                  <span className="font-semibold text-success">{metrics.confirmedReservations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-warning"></div>
                    <span className="text-sm">Pendiente de pago</span>
                  </div>
                  <span className="font-semibold text-warning">{metrics.pendingPayment}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold">{metrics.totalReservations}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Ingresos - Debajo de Estado de Reservas */}
          <Card className="border-secondary/20 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    Gestión de ingresos
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Comparación de tarifas vs competencia
                  </CardDescription>
                </div>
                <Tabs value={revenueTimeRange} onValueChange={(v) => setRevenueTimeRange(v as any)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="today" className="text-xs px-2">Hoy</TabsTrigger>
                    <TabsTrigger value="7days" className="text-xs px-2">7 días</TabsTrigger>
                    <TabsTrigger value="30days" className="text-xs px-2">30 días</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[70%_30%]">
                {/* Columna Izquierda - Gráfico */}
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={currentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey={revenueTimeRange === "today" ? "time" : revenueTimeRange === "7days" ? "day" : "week"}
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(value: number) => [`RD$${value.toLocaleString()}`, '']}
                      />
                      <Line
                        type="monotone"
                        dataKey="hotelRate"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        name="Tarifa del hotel"
                      />
                      <Line
                        type="monotone"
                        dataKey="competitorRate"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 3 }}
                        name="Tarifa competencia"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Leyenda */}
                  <div className="flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">Tarifa del hotel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-muted-foreground">Tarifa competencia</span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha - Tarjeta Informativa */}
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white border-2 border-secondary/20 shadow-sm">
                    <h4 className="text-sm font-semibold mb-3">Tarifa óptima sugerida</h4>
                    {optimalRateData ? (
                      <>
                        <p className="text-3xl font-bold text-secondary mb-1">
                          {formatCurrency(optimalRateData.optimal_price_cents / 100)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          vs tarifa actual: {" "}
                          <span className={optimalRateData.difference_cents >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                            {optimalRateData.difference_cents >= 0 ? "+" : ""}
                            {formatCurrency(Math.abs(optimalRateData.difference_cents) / 100)}
                          </span>
                        </p>

                        <div className="pt-3 border-t space-y-2">
                          <h4 className="text-sm font-semibold mb-2">Oportunidades detectadas</h4>
                          <p className="text-sm">
                            <span className="font-bold">{optimalRateData.opportunities}</span> habitaciones por debajo del mercado
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ocupación: {optimalRateData.occupancy_percent?.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Sin datos de tarifas disponibles
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Configura tarifas en Configuración
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Estos datos comparan tus precios con hoteles similares para ayudarte a ajustar tarifas en tiempo real.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Overall Rating + Tasks */}
        <div className="space-y-4">
          {/* Overall Rating */}
          <Card className="border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Overall Rating
              </CardTitle>
              <CardDescription>Calificación general del hotel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating promedio */}
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

              {/* Desglose de categorías */}
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

          {/* Tasks */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    Tareas Pendientes
                  </CardTitle>
                  <CardDescription>
                    {tasks?.length || 0} tareas activas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateTaskDialogOpen(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Nueva
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard/tasks")}
                    className="text-xs"
                  >
                    Ver todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task: any) => {
                    const priorityConfig = {
                      URGENT: { color: "text-red-500", badge: "destructive", label: "Urgente" },
                      HIGH: { color: "text-orange-500", badge: "secondary", label: "Alta" },
                      MEDIUM: { color: "text-yellow-500", badge: "secondary", label: "Media" },
                      LOW: { color: "text-green-500", badge: "outline", label: "Baja" }
                    };

                    const config = priorityConfig[task.priority as keyof typeof priorityConfig];
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();

                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate("/dashboard/tasks")}
                      >
                        <Checkbox
                          checked={false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              completeTaskMutation.mutate(task.id);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <AlertCircle className={`h-4 w-4 mt-0.5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.task_type} {task.rooms?.room_number && `- Hab. ${task.rooms.room_number}`}
                            {task.due_date && (
                              <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                                {" "}- {isOverdue ? "Vencida" : format(new Date(task.due_date), "dd/MM/yyyy")}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge variant={config.badge as any} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No hay tareas pendientes
                </div>
              )}
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

      {/* Quick Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una tarea rápida desde el dashboard
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Título *</Label>
              <Input
                id="task-title"
                placeholder="Ej: Revisar habitación 302"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="task-description">Descripción</Label>
              <Textarea
                id="task-description"
                placeholder="Detalles de la tarea..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-type">Tipo *</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                >
                  <SelectTrigger id="task-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    <SelectItem value="CLEANING">Limpieza</SelectItem>
                    <SelectItem value="INSPECTION">Inspección</SelectItem>
                    <SelectItem value="REPAIR">Reparación</SelectItem>
                    <SelectItem value="DELIVERY">Entrega</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="task-priority">Prioridad *</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="task-due-date">Fecha límite</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateTaskDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={!newTask.title || createTaskMutation.isPending}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                {createTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
