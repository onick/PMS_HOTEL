import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Bed } from "lucide-react";

const statusConfig = {
  AVAILABLE: { label: "Disponible", color: "bg-success" },
  OCCUPIED: { label: "Ocupada", color: "bg-front-desk" },
  DIRTY: { label: "Sucia", color: "bg-warning" },
  CLEANING: { label: "Limpiando", color: "bg-secondary" },
  MAINTENANCE: { label: "Mantenimiento", color: "bg-destructive" },
  OUT_OF_ORDER: { label: "Fuera de servicio", color: "bg-muted" },
};

export default function RoomStatus() {
  const { data: rooms } = useQuery({
    queryKey: ["room-status"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Agrupar por piso
  const roomsByFloor = rooms?.reduce((acc: any, room: any) => {
    const floor = room.floor || 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const statusStats = rooms?.reduce((acc: any, room: any) => {
    const status = room.status || "AVAILABLE";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-front-desk">
          <DoorOpen className="h-5 w-5" />
          Estado de Habitaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de estados */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="text-center p-2 border rounded">
              <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-1`} />
              <p className="text-xs text-muted-foreground">{config.label}</p>
              <p className="font-semibold">{statusStats?.[status] || 0}</p>
            </div>
          ))}
        </div>

        {/* Habitaciones por piso */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {roomsByFloor && Object.entries(roomsByFloor)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([floor, floorRooms]: [string, any]) => (
              <div key={floor}>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  Piso {floor || "PB"}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {floorRooms.map((room: any) => {
                    const config = statusConfig[room.status as keyof typeof statusConfig];
                    return (
                      <div
                        key={room.id}
                        className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{room.room_number}</span>
                          <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {room.room_types?.name}
                        </p>
                        <Badge 
                          variant="outline" 
                          className="text-xs mt-1 w-full justify-center"
                        >
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
