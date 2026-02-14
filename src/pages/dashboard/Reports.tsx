import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, DollarSign, Download, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useOutletContext } from "react-router-dom";
import { formatCurrencyAmount, formatCurrencyFromCents, normalizeCurrencyCode } from "@/lib/currency";

export default function Reports() {
  const { hotel } = useOutletContext<{ hotel: { currency?: string } }>();
  const currencyCode = normalizeCurrencyCode(hotel?.currency);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fromStr = format(dateRange.from, "yyyy-MM-dd");
  const toStr = format(dateRange.to, "yyyy-MM-dd");

  // Occupancy Report
  const { data: occupancyData, isLoading: loadingOccupancy } = useQuery({
    queryKey: ["occupancy-report", fromStr, toStr],
    queryFn: async () => {
      const res = await api.getOccupancyReport(fromStr, toStr);
      const data = res.data;

      const totalRoomNights = data.daily.reduce((sum: number, d: any) => sum + (d.occupied_rooms || 0), 0);
      const availableRoomNights = data.daily.reduce((sum: number, d: any) => sum + (d.total_rooms || 0), 0);

      return {
        totalRooms: data.daily[0]?.total_rooms || 0,
        totalReservations: data.summary.days_with_data,
        totalRoomNights,
        availableRoomNights,
        occupancyRate: data.summary.avg_occupancy_rate.toFixed(2),
      };
    },
  });

  // Revenue Report
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-report-page", fromStr, toStr],
    queryFn: async () => {
      const res = await api.getRevenueReport(fromStr, toStr, "day");
      const data = res.data;

      return {
        totalRevenue: data.summary.total_revenue_cents,
        roomRevenue: data.summary.total_room_revenue_cents,
        otherRevenue: data.summary.total_other_revenue_cents,
        chargeCount: data.data.length,
        byCategory: {
          ROOM: data.summary.total_room_revenue_cents,
          OTHER: data.summary.total_other_revenue_cents,
        } as Record<string, number>,
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
      ws1['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Ocupación");

      // Sheet 2: Revenue Report
      const revenueSheet: any[][] = [
        ["REPORTE DE INGRESOS"],
        [`Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`],
        [],
        ["Categoría", "Ingresos", "Porcentaje"],
      ];

      Object.entries(revenueData?.byCategory || {}).forEach(([category, amount]) => {
        const percentage = ((amount / (revenueData?.totalRevenue || 1)) * 100).toFixed(1);
        revenueSheet.push([
          categoryLabels[category] || category,
          formatCurrencyAmount(amount / 100, currencyCode),
          `${percentage}%`,
        ]);
      });

      revenueSheet.push([]);
      revenueSheet.push(["TOTAL", formatCurrencyAmount((revenueData?.totalRevenue || 0) / 100, currencyCode), "100%"]);

      const ws2 = XLSX.utils.aoa_to_sheet(revenueSheet);
      ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Ingresos");

      const filename = `Reporte_HotelMate_${format(dateRange.from, "ddMMyyyy")}-${format(dateRange.to, "ddMMyyyy")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Reporte exportado correctamente");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error al exportar el reporte");
    }
  };

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
                      to: endOfMonth(new Date()),
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
                      to: endOfMonth(subMonths(new Date(), 1)),
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
                    <div className="text-3xl font-bold text-primary">
                      {occupancyData?.occupancyRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Días con Datos
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
                      <span className="text-sm font-medium">Días con Auditoría:</span>
                      <span className="font-bold">{occupancyData?.totalReservations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium text-primary">Tasa de Ocupación:</span>
                      <span className="font-bold text-primary text-lg">{occupancyData?.occupancyRate}%</span>
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
                    <div className="text-3xl font-bold text-success">
                      {formatCurrencyFromCents(revenueData?.totalRevenue || 0, currencyCode)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ingresos Habitaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrencyFromCents(revenueData?.roomRevenue || 0, currencyCode)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Otros Ingresos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrencyFromCents(revenueData?.otherRevenue || 0, currencyCode)}
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
                              <span className="font-bold">{formatCurrencyAmount(amount / 100, currencyCode)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full transition-all"
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
