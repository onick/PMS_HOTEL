import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";

const statusConfig: Record<RoomStatus, { label: string; color: string; icon: any }> = {
  AVAILABLE: { label: "Limpia", color: "bg-success", icon: CheckCircle2 },
  OCCUPIED: { label: "Ocupada", color: "bg-front-desk", icon: Sparkles },
  MAINTENANCE: { label: "Requiere limpieza", color: "bg-warning", icon: Sparkles },
  BLOCKED: { label: "Bloqueada", color: "bg-muted", icon: Wrench },
};

export default function RoomsByStatus() {
  const { data: rooms, refetch } = useQuery({
    queryKey: ["housekeeping-rooms"],
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
        .order("status", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: newStatus })
        .eq("id", roomId);

      if (error) throw error;

      toast.success("Estado actualizado correctamente");
      refetch();
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    }
  };

  // Agrupar por estado
  const roomsByStatus = rooms?.reduce((acc: any, room: any) => {
    const status = room.status || "AVAILABLE";
    if (!acc[status]) acc[status] = [];
    acc[status].push(room);
    return acc;
  }, {});

  const maintenanceRooms = roomsByStatus?.MAINTENANCE || [];
  const otherRooms = rooms?.filter((r: any) => r.status !== "MAINTENANCE") || [];

  return (
    <div className="space-y-6">
      {/* Habitaciones que requieren limpieza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-housekeeping">
            <Sparkles className="h-5 w-5" />
            Requieren Limpieza ({maintenanceRooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceRooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay habitaciones pendientes de limpieza
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {maintenanceRooms.map((room: any) => (
                <div
                  key={room.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{room.room_number}</span>
                    <Badge variant="outline" className="bg-warning/10">
                      Pendiente
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    {room.room_types?.name}
                  </p>
                  <Button
                    onClick={() => handleStatusChange(room.id, "AVAILABLE")}
                    size="sm"
                    className="w-full bg-housekeeping hover:bg-housekeeping/90"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Marcar Limpia
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Otras habitaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Habitaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {otherRooms.map((room: any) => {
              const config = statusConfig[room.status as RoomStatus];
              const Icon = config.icon;
              
              return (
                <div
                  key={room.id}
                  className="p-3 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{room.room_number}</span>
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {room.room_types?.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    <span className="text-xs">{config.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
