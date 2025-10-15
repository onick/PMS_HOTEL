import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryDay {
  day: string;
  room_type_name: string;
  total: number;
  reserved: number;
  holds: number;
  available: number;
}

const InventoryCalendar = ({ hotelId }: { hotelId: string }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inventory, setInventory] = useState<InventoryDay[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [hotelId, currentMonth]);

  const fetchData = async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    // Obtener tipos de habitación
    const { data: roomTypesData } = await supabase
      .from("room_types")
      .select("*")
      .eq("hotel_id", hotelId);

    if (roomTypesData) {
      setRoomTypes(roomTypesData);
    }

    // Obtener inventario del mes
    const { data: invData } = await supabase
      .from("inventory_by_day")
      .select(`
        *,
        room_types (name)
      `)
      .eq("hotel_id", hotelId)
      .gte("day", start)
      .lte("day", end)
      .order("day");

    if (invData) {
      const processed = invData.map((item: any) => ({
        day: item.day,
        room_type_name: item.room_types?.name || "Sin tipo",
        total: item.total,
        reserved: item.reserved,
        holds: item.holds,
        available: item.total - item.reserved - item.holds,
      }));
      setInventory(processed);
    }

    setLoading(false);
  };

  const getDayInventory = (day: string, roomTypeName: string) => {
    return inventory.find((inv) => inv.day === day && inv.room_type_name === roomTypeName);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-xl font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Cargando inventario...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {roomTypes.map((roomType) => (
            <Card key={roomType.id} className="p-4">
              <h4 className="font-semibold mb-3">{roomType.name}</h4>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const inv = getDayInventory(dayStr, roomType.name);
                  const available = inv?.available || 0;
                  const total = inv?.total || 0;

                  return (
                    <div
                      key={dayStr}
                      className="p-2 rounded border text-center text-sm"
                    >
                      <div className="font-semibold mb-1">{format(day, "d")}</div>
                      <Badge
                        variant={available === 0 ? "destructive" : available < total / 2 ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {available}/{total}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryCalendar;