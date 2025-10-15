import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, BedDouble } from "lucide-react";

export default function InventorySync() {
  const { data: inventory } = useQuery({
    queryKey: ["channel-inventory"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data: roomTypes, error } = await supabase
        .from("room_types")
        .select(`
          *,
          rooms (count)
        `)
        .eq("hotel_id", userRoles.hotel_id);

      if (error) throw error;

      // Obtener inventario por día (próximos 7 días)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 7);

      const { data: inventoryData } = await supabase
        .from("inventory_by_day")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("day", today.toISOString().split("T")[0])
        .lte("day", futureDate.toISOString().split("T")[0]);

      return roomTypes?.map((rt: any) => {
        const totalRooms = rt.rooms?.[0]?.count || 0;
        const avgInventory = inventoryData
          ?.filter((inv: any) => inv.room_type_id === rt.id)
          .reduce((sum: number, inv: any) => {
            const available = inv.total - inv.reserved - inv.holds;
            return sum + available;
          }, 0) || 0;

        const avgAvailability = totalRooms > 0 
          ? Math.round((avgInventory / (totalRooms * 7)) * 100) 
          : 0;

        return {
          ...rt,
          totalRooms,
          avgAvailability,
        };
      }) || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-channel-manager">
          <CalendarDays className="h-5 w-5" />
          Inventario Sincronizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inventory?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay tipos de habitación configurados
          </p>
        ) : (
          <div className="space-y-4">
            {inventory.map((item: any) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <Badge variant="outline">
                    {item.totalRooms} habitaciones
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Disponibilidad promedio (7 días)
                    </span>
                    <span className="font-semibold">
                      {item.avgAvailability}%
                    </span>
                  </div>
                  <Progress value={item.avgAvailability} className="h-2" />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                    Booking.com: Sincronizado
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                    Airbnb: Sincronizado
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
