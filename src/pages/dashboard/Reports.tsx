import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, DollarSign, Download, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Get hotel_id
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Occupancy Report
  const { data: occupancyData, isLoading: loadingOccupancy } = useQuery({
    queryKey: ["occupancy-report", userRoles?.hotel_id, dateRange],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      // Get total rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", userRoles.hotel_id);

      const totalRooms = rooms?.length || 1; // Avoid division by zero

      // Get reservations in date range
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("check_in, check_out, status")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("check_out", dateRange.from.toISOString())
        .lte("check_in", dateRange.to.toISOString())
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      if (error) throw error;

      // Calculate occupied room nights
      let totalRoomNights = 0;
      reservations?.forEach((res) => {
        const checkIn = new Date(res.check_in);
        const checkOut = new Date(res.check_out);
        const nights = differenceInDays(checkOut, checkIn);
        totalRoomNights += nights;
      });

      // Calculate available room nights
      const daysInRange = differenceInDays(dateRange.to, dateRange.from) + 1;
      const availableRoomNights = totalRooms * daysInRange;
      const occupancyRate = availableRoomNights > 0 
        ? (totalRoomNights / availableRoomNights) * 100 
        : 0;

      return {
        totalRooms,
        totalReservations: reservations?.length || 0,
        totalRoomNights,
        availableRoomNights,
        occupancyRate: occupancyRate.toFixed(2),
      };
    },
  });

  // Revenue Report
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-report", userRoles?.hotel_id, dateRange],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      // Get all folios with charges in date range
      const { data: charges, error } = await supabase
        .from("folio_charges")
        .select(`
          *,
          folios!inner(hotel_id, reservations!inner(check_in, check_out))
        `)
        .eq("folios.hotel_id", userRoles.hotel_id)
        .gte("charge_date", dateRange.from.toISOString().split('T')[0])
        .lte("charge_date", dateRange.to.toISOString().split('T')[0]);

      if (error) throw error;

      // Group by category
      const byCategory: Record<string, number> = {};
      let totalRevenue = 0;

      charges?.forEach((charge: any) => {
        const amount = charge.amount_cents;
        if (amount > 0) { // Only count charges, not payments
          const category = charge.charge_category || 'OTHER';
          byCategory[category] = (byCategory[category] || 0) + amount;
          totalRevenue += amount;
        }
      });

      return {
        totalRevenue,
        byCategory,
        chargeCount: charges?.filter((c: any) => c.amount_cents > 0).length || 0,
      };
    },
  });

  const categoryLabels: Record<string, string> = {
    ROOM: "Habitaciones",
    FOOD: "Alimentos",
    BEVERAGE: "Bebidas",
    MINIBAR: "Minibar",
    LAUNDRY: "Lavandería",
    SPA: "Spa",
    PARKING: "Estacionamiento",
    OTHER: "Otros",
  };

  const handleExportExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Occupancy Report
      const occupancySheet = [
        ["REPORTE DE OCUPACIÓN"],
        [`Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`],
        [],
        ["Métrica", "Valor"],
        ["Total de Habitaciones", occupancyData?.totalRooms || 0],
        ["Total de Reservas", occupancyData?.totalReservations || 0],
        ["Noches Ocupadas", occupancyData?.totalRoomNights || 0],
        ["Noches Disponibles", occupancyData?.availableRoomNights || 0],
        ["Tasa de Ocupación", `${occupancyData?.occupancyRate || 0}%`],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(occupancySheet);

      // Set column widths
      ws1['!cols'] = [
        { wch: 25 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws1, "Ocupación");

      // Sheet 2: Revenue Report
      const revenueSheet = [
        ["REPORTE DE INGRESOS"],
        [`Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`],
        [],
        ["Categoría", "Ingresos", "Porcentaje"],
      ];

      // Add category data
      Object.entries(revenueData?.byCategory || {}).forEach(([category, amount]) => {
        const percentage = ((amount / (revenueData?.totalRevenue || 1)) * 100).toFixed(1);
        revenueSheet.push([
          categoryLabels[category] || category,
          `$${(amount / 100).toFixed(2)}`,
          `${percentage}%`
        ]);
      });

      // Add total
      revenueSheet.push([]);
      revenueSheet.push(["TOTAL", `$${((revenueData?.totalRevenue || 0) / 100).toFixed(2)}`, "100%"]);
      revenueSheet.push([]);
      revenueSheet.push(["Total de Cargos", revenueData?.chargeCount || 0]);

      const ws2 = XLSX.utils.aoa_to_sheet(revenueSheet);

      // Set column widths
      ws2['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws2, "Ingresos");

      // Generate filename with date
      const filename = `Reporte_SOLARIS_${format(dateRange.from, "ddMMyyyy")}-${format(dateRange.to, "ddMMyyyy")}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      toast.success("Reporte exportado correctamente");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error al exportar el reporte");
    }
  };

  if (!userRoles?.hotel_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reportes & Analytics</h1>
          <p className="text-muted-foreground">
            Análisis de ocupación e ingresos del hotel
          </p>
        </div>
        <Button onClick={handleExportExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar a Excel
        </Button>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  {format(dateRange.from, "dd MMM yyyy", { locale: es })} - {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setDateRange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Este mes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 1)),
                      to: endOfMonth(subMonths(new Date(), 1))
                    })}
                  >
                    Mes anterior
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occupancy">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ocupación
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Ingresos
          </TabsTrigger>
        </TabsList>

        {/* Occupancy Report */}
        <TabsContent value="occupancy" className="space-y-4">
          {loadingOccupancy ? (
            <Card>
              <CardContent className="py-8 text-center">
                Cargando reporte de ocupación...
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tasa de Ocupación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {occupancyData?.occupancyRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Reservas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {occupancyData?.totalReservations}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Noches Ocupadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {occupancyData?.totalRoomNights}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Noches Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {occupancyData?.availableRoomNights}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Ocupación</CardTitle>
                  <CardDescription>
                    Del {format(dateRange.from, "dd MMMM yyyy", { locale: es })} al {format(dateRange.to, "dd MMMM yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Total de Habitaciones:</span>
                      <span className="font-bold">{occupancyData?.totalRooms}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Reservas en el Período:</span>
                      <span className="font-bold">{occupancyData?.totalReservations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">Tasa de Ocupación:</span>
                      <span className="font-bold text-blue-600 text-lg">{occupancyData?.occupancyRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4">
          {loadingRevenue ? (
            <Card>
              <CardContent className="py-8 text-center">
                Cargando reporte de ingresos...
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ingresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ${((revenueData?.totalRevenue || 0) / 100).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Cargos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {revenueData?.chargeCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Promedio por Cargo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      ${revenueData?.chargeCount 
                        ? ((revenueData.totalRevenue / revenueData.chargeCount) / 100).toFixed(2)
                        : "0.00"
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Categoría</CardTitle>
                  <CardDescription>
                    Del {format(dateRange.from, "dd MMMM yyyy", { locale: es })} al {format(dateRange.to, "dd MMMM yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(revenueData?.byCategory || {}).map(([category, amount]) => {
                      const percentage = revenueData?.totalRevenue 
                        ? ((amount / revenueData.totalRevenue) * 100).toFixed(1)
                        : "0";
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {categoryLabels[category] || category}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">{percentage}%</span>
                              <span className="font-bold">${(amount / 100).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
