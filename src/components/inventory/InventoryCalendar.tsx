import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const InventoryCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ["inventory-calendar-room-types"],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return (res.data || []) as any[];
    },
  });

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

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Cargando inventario...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {roomTypes?.map((roomType: any) => {
            const totalRooms = roomType.rooms_count || 0;

            return (
              <Card key={roomType.id} className="p-4">
                <h4 className="font-semibold mb-3">
                  {roomType.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({totalRooms} habitaciones)
                  </span>
                </h4>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");

                    return (
                      <div
                        key={dayStr}
                        className="p-2 rounded border text-center text-sm"
                      >
                        <div className="font-semibold mb-1">{format(day, "d")}</div>
                        <Badge variant="default" className="text-xs">
                          {totalRooms}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InventoryCalendar;
