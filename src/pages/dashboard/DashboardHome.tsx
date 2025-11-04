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
import GuestsList from "@/components/crm/GuestsList";
import GuestDetails from "@/components/crm/GuestDetails";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Datos de ejemplo para el gráfico de gestión de ingresos
  const revenueChartData = {
    today: [
      { time: "8am", hotelRate: 4850, competitorRate: 5100 },
      { time: "12pm", hotelRate: 4850, competitorRate: 5050 },
      { time: "4pm", hotelRate: 4900, competitorRate: 5200 },
      { time: "8pm", hotelRate: 4900, competitorRate: 5150 },
    ],
    "7days": [
      { day: "Lun", hotelRate: 4850, competitorRate: 5100 },
      { day: "Mar", hotelRate: 4900, competitorRate: 5200 },
      { day: "Mié", hotelRate: 4750, competitorRate: 5050 },
      { day: "Jue", hotelRate: 4800, competitorRate: 5150 },
      { day: "Vie", hotelRate: 5200, competitorRate: 5400 },
      { day: "Sáb", hotelRate: 5500, competitorRate: 5600 },
      { day: "Dom", hotelRate: 5300, competitorRate: 5500 },
    ],
    "30days": [
      { week: "Sem 1", hotelRate: 4850, competitorRate: 5100 },
      { week: "Sem 2", hotelRate: 4920, competitorRate: 5180 },
      { week: "Sem 3", hotelRate: 5050, competitorRate: 5250 },
      { week: "Sem 4", hotelRate: 5200, competitorRate: 5400 },
    ],
  };

  const currentChartData = revenueChartData[revenueTimeRange];

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
                    <p className="text-3xl font-bold text-secondary mb-1">
                      {formatCurrency(5200)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      vs: tarifa actual: <span className="text-success font-semibold">+{formatCurrency(350)}</span>
                    </p>

                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-semibold mb-2">Oportunidades detectadas</h4>
                      <p className="text-sm">
                        <span className="font-bold">3</span> habitaciones por debajo del mercado
                      </p>
                    </div>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                Tareas Pendientes
              </CardTitle>
              <CardDescription>5 tareas activas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Revisar habitación 302</p>
                    <p className="text-xs text-muted-foreground">Mantenimiento - Vence hoy</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">Urgente</Badge>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Limpieza general lobby</p>
                    <p className="text-xs text-muted-foreground">Housekeeping - Mañana</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Normal</Badge>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Inventario despensa</p>
                    <p className="text-xs text-muted-foreground">Inventario - Esta semana</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Baja</Badge>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Actualizar precios temporada alta</p>
                    <p className="text-xs text-muted-foreground">Admin - 3 días</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Normal</Badge>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Revisar reportes mensuales</p>
                    <p className="text-xs text-muted-foreground">Reportes - Próxima semana</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Baja</Badge>
                </div>
              </div>
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
