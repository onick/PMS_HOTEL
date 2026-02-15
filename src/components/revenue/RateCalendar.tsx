import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  hotelId: string;
}

export default function RateCalendar({ hotelId }: Props) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");

  const formatRate = (cents: number, currency: string) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types-calendar", hotelId],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return (res.data || []) as any[];
    },
    enabled: !!hotelId,
  });

  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const displayTypes =
    selectedRoomType === "all"
      ? roomTypes
      : roomTypes?.filter((rt: any) => String(rt.id) === selectedRoomType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-revenue" />
              Calendario de Tarifas e Inventario
            </CardTitle>
            <CardDescription>
              Vista de 14 días con precios por tipo de habitación
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de habitación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {roomTypes?.map((rt: any) => (
                  <SelectItem key={rt.id} value={String(rt.id)}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card z-10 text-left p-2 border-b font-medium text-muted-foreground min-w-[140px]">
                  Tipo
                </th>
                {days.map((day) => {
                  const isToday = isSameDay(day, today);
                  return (
                    <th
                      key={day.toISOString()}
                      className={`text-center p-2 border-b min-w-[80px] ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <div className="font-medium">
                        {format(day, "EEE", { locale: es })}
                      </div>
                      <div className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {format(day, "dd/MM")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayTypes?.map((roomType: any) => (
                <tr key={roomType.id} className="border-b last:border-0">
                  <td className="sticky left-0 bg-card z-10 p-2">
                    <div className="font-medium">{roomType.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Base: {formatRate(roomType.base_rate_cents || 0, roomType.currency || "USD")}
                    </div>
                  </td>
                  {days.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isToday = isSameDay(day, today);
                    const basePrice = roomType.base_rate_cents || 0;

                    return (
                      <td
                        key={dayStr}
                        className={`text-center p-1.5 ${isToday ? "bg-primary/5" : ""}`}
                      >
                        <div className="text-xs text-muted-foreground">
                          {formatRate(basePrice, roomType.currency || "USD")}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {(!displayTypes || displayTypes.length === 0) && (
                <tr>
                  <td colSpan={15} className="text-center py-8 text-muted-foreground">
                    No hay tipos de habitación configurados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
            {"< 40% ocupación"}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-revenue/20 border border-revenue/30" />
            70-90% ocupación
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
            {"> 90% ocupación"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
