import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("id, name, base_price_cents")
        .eq("hotel_id", hotelId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  // Get inventory for the 14-day window
  const windowStart = format(weekStart, "yyyy-MM-dd");
  const windowEnd = format(addDays(weekStart, 13), "yyyy-MM-dd");

  const { data: inventory } = useQuery({
    queryKey: ["inventory-calendar", hotelId, windowStart, windowEnd, selectedRoomType],
    queryFn: async () => {
      let query = supabase
        .from("inventory_by_day")
        .select("*")
        .eq("hotel_id", hotelId)
        .gte("day", windowStart)
        .lte("day", windowEnd);

      if (selectedRoomType !== "all") {
        query = query.eq("room_type_id", selectedRoomType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const { data: rateHistory } = useQuery({
    queryKey: ["rate-history-calendar", hotelId, windowStart, windowEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_history")
        .select("*")
        .eq("hotel_id", hotelId)
        .gte("date", windowStart)
        .lte("date", windowEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const getInventoryForDay = (day: string, roomTypeId?: string) => {
    if (!inventory) return null;
    return inventory.find(
      (inv) =>
        inv.day === day &&
        (roomTypeId ? inv.room_type_id === roomTypeId : true),
    );
  };

  const getRateForDay = (day: string, roomTypeId: string) => {
    if (!rateHistory) return null;
    return rateHistory.find(
      (r) => r.date === day && r.room_type_id === roomTypeId,
    );
  };

  const getOccupancyColor = (occupancyPct: number) => {
    if (occupancyPct >= 90) return "bg-destructive/20 text-destructive border-destructive/30";
    if (occupancyPct >= 70) return "bg-revenue/20 text-revenue border-revenue/30";
    if (occupancyPct >= 40) return "bg-success/20 text-success border-success/30";
    return "bg-muted text-muted-foreground";
  };

  const displayTypes =
    selectedRoomType === "all"
      ? roomTypes
      : roomTypes?.filter((rt) => rt.id === selectedRoomType);

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
              Vista de 14 días con disponibilidad y precios por tipo de habitación
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de habitación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {roomTypes?.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
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
                onClick={() =>
                  setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                }
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
                      <div
                        className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}
                      >
                        {format(day, "dd/MM")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayTypes?.map((roomType) => (
                <tr key={roomType.id} className="border-b last:border-0">
                  <td className="sticky left-0 bg-card z-10 p-2">
                    <div className="font-medium">{roomType.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Base: ${(roomType.base_price_cents / 100).toFixed(0)}
                    </div>
                  </td>
                  {days.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const inv = getInventoryForDay(dayStr, roomType.id);
                    const rate = getRateForDay(dayStr, roomType.id);
                    const isToday = isSameDay(day, today);

                    const available = inv
                      ? inv.total - inv.reserved - inv.holds
                      : null;
                    const occupancyPct = inv && inv.total > 0
                      ? Math.round(((inv.reserved + inv.holds) / inv.total) * 100)
                      : 0;
                    const price = rate
                      ? rate.price_cents
                      : roomType.base_price_cents;

                    return (
                      <td
                        key={dayStr}
                        className={`text-center p-1.5 ${isToday ? "bg-primary/5" : ""}`}
                      >
                        {inv ? (
                          <div className="space-y-1">
                            <div className="font-medium text-xs">
                              ${(price / 100).toFixed(0)}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 ${getOccupancyColor(occupancyPct)}`}
                            >
                              {available} disp
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            ${(roomType.base_price_cents / 100).toFixed(0)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {(!displayTypes || displayTypes.length === 0) && (
                <tr>
                  <td
                    colSpan={15}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay tipos de habitación configurados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
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
