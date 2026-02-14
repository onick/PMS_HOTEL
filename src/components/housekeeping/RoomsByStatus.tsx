import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type HousekeepingStatus = "CLEAN" | "DIRTY" | "INSPECTING" | "OUT_OF_ORDER";

const statusConfig: Record<HousekeepingStatus, { label: string; color: string; icon: any }> = {
  CLEAN: { label: "Limpia", color: "bg-success", icon: CheckCircle2 },
  DIRTY: { label: "Requiere limpieza", color: "bg-warning", icon: Sparkles },
  INSPECTING: { label: "Inspeccionando", color: "bg-front-desk", icon: Sparkles },
  OUT_OF_ORDER: { label: "Fuera de servicio", color: "bg-muted", icon: Wrench },
};

export default function RoomsByStatus() {
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ["housekeeping-rooms"],
    queryFn: async () => {
      const res = await api.getStatusGrid();
      return (res.data || []) as any[];
    },
  });

  const handleMarkClean = async (roomId: number) => {
    try {
      await api.markRoomClean(roomId);
      toast.success("Habitación marcada como limpia");
      queryClient.invalidateQueries({ queryKey: ["housekeeping-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-stats"] });
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    }
  };

  const dirtyRooms = rooms?.filter((r: any) => r.housekeeping_status === "DIRTY") || [];
  const otherRooms = rooms?.filter((r: any) => r.housekeeping_status !== "DIRTY") || [];

  return (
    <div className="space-y-6">
      {/* Habitaciones que requieren limpieza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-housekeeping">
            <Sparkles className="h-5 w-5" />
            Requieren Limpieza ({dirtyRooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dirtyRooms.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <p className="font-medium">¡Todo limpio!</p>
                <p className="text-sm text-muted-foreground">
                  No hay habitaciones que requieran limpieza en este momento
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dirtyRooms.map((room: any) => (
                <div
                  key={room.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{room.number}</span>
                    <Badge variant="outline" className="bg-warning/10">
                      Pendiente
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    {room.room_type?.name}
                  </p>
                  <Button
                    onClick={() => handleMarkClean(room.id)}
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
              const hkStatus = (room.housekeeping_status || "CLEAN") as HousekeepingStatus;
              const config = statusConfig[hkStatus] || statusConfig.CLEAN;
              const Icon = config.icon;

              return (
                <div
                  key={room.id}
                  className="p-3 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{room.number}</span>
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {room.room_type?.name}
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
