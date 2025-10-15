import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function CleaningPriority() {
  const today = new Date().toISOString().split("T")[0];

  const { data: priorities } = useQuery({
    queryKey: ["cleaning-priorities"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      // Obtener habitaciones sucias con próximas llegadas
      const { data: arrivals, error: arrivalsError } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("check_in", today)
        .in("status", ["CONFIRMED", "PENDING_PAYMENT"]);

      if (arrivalsError) throw arrivalsError;

      // Obtener todas las habitaciones sucias
      const { data: dirtyRooms, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("status", "MAINTENANCE");

      if (roomsError) throw roomsError;

      // Marcar prioridad alta para habitaciones con llegadas hoy
      const priorityList = dirtyRooms?.map((room: any) => {
        const hasArrival = arrivals?.some(
          (r: any) => r.room_type_id === room.room_type_id
        );
        
        return {
          ...room,
          priority: hasArrival ? "high" : "normal",
          arrivalCount: arrivals?.filter(
            (r: any) => r.room_type_id === room.room_type_id
          ).length || 0,
        };
      });

      // Ordenar: alta prioridad primero
      return priorityList?.sort((a, b) => {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
        return 0;
      }) || [];
    },
  });

  const highPriority = priorities?.filter((p: any) => p.priority === "high") || [];
  const normalPriority = priorities?.filter((p: any) => p.priority === "normal") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-housekeeping">
          <AlertCircle className="h-5 w-5" />
          Prioridad de Limpieza
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alta prioridad */}
        {highPriority.length > 0 && (
          <div>
            <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Prioridad Alta ({highPriority.length})
            </h4>
            <div className="space-y-2">
              {highPriority.map((room: any) => (
                <div
                  key={room.id}
                  className="p-3 border border-destructive/30 rounded-lg bg-destructive/5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Hab. {room.room_number}</span>
                      <Badge variant="destructive" className="text-xs">
                        Urgente
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {room.arrivalCount} llegada{room.arrivalCount > 1 ? "s" : ""} hoy
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {room.room_types?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prioridad normal */}
        {normalPriority.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Prioridad Normal ({normalPriority.length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {normalPriority.map((room: any) => (
                <div
                  key={room.id}
                  className="p-2 border rounded text-center"
                >
                  <span className="font-semibold">{room.room_number}</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {room.room_types?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {priorities?.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No hay habitaciones pendientes de limpieza
          </p>
        )}
      </CardContent>
    </Card>
  );
}
