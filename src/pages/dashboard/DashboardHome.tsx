import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CalendarCheck, 
  Home,
  Clock,
  Percent
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";

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
  const [metrics, setMetrics] = useState<DashboardMetrics>({
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
  });
  const [loading, setLoading] = useState(true);
  const [upcomingCheckIns, setUpcomingCheckIns] = useState<any[]>([]);
  const [upcomingCheckOuts, setUpcomingCheckOuts] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
  }, [hotel.id]);

  const loadMetrics = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    
    // Total de reservas
    const { data: allReservations } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("hotel_id", hotel.id);

    const confirmed = allReservations?.filter(r => r.status === "CONFIRMED") || [];
    const pending = allReservations?.filter(r => r.status === "PENDING_PAYMENT") || [];

    // Ingresos totales (solo confirmadas)
    const totalRevenue = confirmed.reduce((sum, r) => sum + (r.total_amount_cents / 100), 0);
    const avgRate = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

    // Total de habitaciones
    const { count: totalRooms } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("hotel_id", hotel.id);

    // Reservas activas hoy
    const { data: activeToday } = await supabase
      .from("reservations")
      .select("*")
      .eq("hotel_id", hotel.id)
      .eq("status", "CONFIRMED")
      .lte("check_in", today)
      .gte("check_out", today);

    // Check-ins hoy
    const { data: checkInsToday } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("hotel_id", hotel.id)
      .eq("check_in", today)
      .order("check_in", { ascending: true })
      .limit(5);

    // Check-outs hoy
    const { data: checkOutsToday } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("hotel_id", hotel.id)
      .eq("check_out", today)
      .order("check_out", { ascending: true })
      .limit(5);

    const occupancyRate = totalRooms ? ((activeToday?.length || 0) / totalRooms) * 100 : 0;

    setMetrics({
      totalReservations: allReservations?.length || 0,
      confirmedReservations: confirmed.length,
      pendingPayment: pending.length,
      totalRevenue,
      averageRate: avgRate,
      occupancyRate,
      totalRooms: totalRooms || 0,
      occupiedToday: activeToday?.length || 0,
      checkInsToday: checkInsToday?.length || 0,
      checkOutsToday: checkOutsToday?.length || 0,
      revenueChange: 12.5, // Mock - calcular vs mes anterior
      occupancyChange: 8.2, // Mock - calcular vs mes anterior
    });

    setUpcomingCheckIns(checkInsToday || []);
    setUpcomingCheckOuts(checkOutsToday || []);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: hotel.currency || "DOP",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando métricas...</p>
      </div>
    );
  }

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

      {/* Actividad del día */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Estado de reservas */}
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
      </div>
    </div>
  );
}
