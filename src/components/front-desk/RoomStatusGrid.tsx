import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpen, Bed, User, Calendar, AlertCircle, CheckCircle2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RoomStatusCard } from "@/components/dashboard/RoomStatusCard";

// Map the combined occupancy + housekeeping status to a display status
function getDisplayStatus(room: any): string {
  if (room.occupancy_status === "OCCUPIED") return "OCCUPIED";
  if (room.occupancy_status === "BLOCKED") return "OUT_OF_SERVICE";
  // Vacant room — show housekeeping status
  if (room.housekeeping_status === "CLEAN") return "CLEAN";
  if (room.housekeeping_status === "DIRTY") return "DIRTY";
  if (room.housekeeping_status === "INSPECTING") return "INSPECTING";
  if (room.housekeeping_status === "OUT_OF_ORDER") return "OUT_OF_SERVICE";
  return "CLEAN";
}

const statusConfig = {
  CLEAN: {
    label: "Limpia",
    color: "bg-success hover:bg-success/80",
    border: "border-success/50",
    icon: CheckCircle2,
  },
  DIRTY: {
    label: "Sucia",
    color: "bg-warning hover:bg-warning/80",
    border: "border-warning/50",
    icon: AlertCircle,
  },
  INSPECTING: {
    label: "Inspeccionando",
    color: "bg-secondary hover:bg-secondary/80",
    border: "border-secondary/50",
    icon: User,
  },
  OUT_OF_SERVICE: {
    label: "Fuera de Servicio",
    color: "bg-destructive hover:bg-destructive/80",
    border: "border-destructive/50",
    icon: Wrench,
  },
  OCCUPIED: {
    label: "Ocupada",
    color: "bg-primary hover:bg-primary/80",
    border: "border-primary/50",
    icon: User,
  },
} as const;

type DisplayStatus = keyof typeof statusConfig;

interface Room {
  id: number;
  number: string;
  floor: number;
  occupancy_status: string;
  housekeeping_status: string;
  room_type?: { id: number; name: string };
  notes?: string;
  current_guest?: { id: number; name: string; check_out_date: string };
}

// Actions available per display status
const statusActions: Record<string, { label: string; action: string }[]> = {
  DIRTY: [
    { label: "Marcar Limpia", action: "CLEAN" },
    { label: "Marcar Inspeccionando", action: "INSPECTING" },
  ],
  CLEAN: [
    { label: "Marcar Sucia", action: "DIRTY" },
    { label: "Fuera de Servicio", action: "OUT_OF_SERVICE" },
  ],
  INSPECTING: [
    { label: "Marcar Limpia", action: "CLEAN" },
    { label: "Marcar Sucia", action: "DIRTY" },
  ],
  OUT_OF_SERVICE: [
    { label: "Volver a Servicio", action: "BACK_IN_SERVICE" },
  ],
  OCCUPIED: [],
};

export default function RoomStatusGrid() {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: statusGridRes, isLoading } = useQuery({
    queryKey: ["rooms-status-grid"],
    queryFn: () => api.getStatusGrid(),
  });

  const rooms = (statusGridRes?.rooms || []) as Room[];
  const summary = statusGridRes?.summary;

  // Compute display statuses for stats
  const statusStats = rooms.reduce((acc: Record<string, number>, room: Room) => {
    const ds = getDisplayStatus(room);
    acc[ds] = (acc[ds] || 0) + 1;
    return acc;
  }, {});

  // Group by floor
  const roomsByFloor = rooms.reduce((acc: Record<number, Room[]>, room: Room) => {
    const floor = room.floor || 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const statusChangeMutation = useMutation({
    mutationFn: async ({ roomId, action }: { roomId: number; action: string }) => {
      switch (action) {
        case "CLEAN":
          return api.markRoomClean(roomId);
        case "DIRTY":
          return api.markRoomDirty(roomId);
        case "INSPECTING":
          return api.markRoomInspecting(roomId);
        case "OUT_OF_SERVICE":
          return api.roomOutOfOrder(roomId);
        case "BACK_IN_SERVICE":
          return api.roomBackInService(roomId);
        default:
          throw new Error("Acción no válida");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Estado actualizado correctamente");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar estado");
    },
  });

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando habitaciones...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-front-desk">
            <DoorOpen className="h-5 w-5" />
            Estado de Habitaciones
            <Badge variant="outline" className="ml-2">
              {rooms?.length || 0} habitaciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status summary — only show statuses that exist */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(Object.entries(statusConfig) as [DisplayStatus, typeof statusConfig[DisplayStatus]][])
              .filter(([status]) => (statusStats[status] || 0) > 0)
              .map(([status, config]) => {
                const Icon = config.icon;
                const count = statusStats[status] || 0;
                return (
                  <div
                    key={status}
                    className={`p-3 sm:p-4 border-2 rounded-lg ${config.border} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <div className={`p-1.5 sm:p-2 rounded-full ${config.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-xl sm:text-2xl">{count}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{config.label}</p>
                  </div>
                );
              })}
          </div>

          {/* Rooms grid by floor */}
          <div className="space-y-6">
            {Object.entries(roomsByFloor)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([floor, floorRooms]) => (
                <div key={floor}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold text-lg">
                      Piso {floor || "PB"}
                    </h4>
                    <Badge variant="secondary">{floorRooms.length} hab.</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {floorRooms.map((room: Room) => {
                      const displayStatus = getDisplayStatus(room);
                      return (
                        <RoomStatusCard
                          key={room.id}
                          roomNumber={room.number}
                          type={room.room_type?.name || "Standard"}
                          status={displayStatus as any}
                          onClick={() => handleRoomClick(room)}
                          className="w-full"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Room detail modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Habitación {selectedRoom?.number}
            </DialogTitle>
            <DialogDescription>
              Ver y modificar el estado de la habitación
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (() => {
            const displayStatus = getDisplayStatus(selectedRoom);
            const config = statusConfig[displayStatus as DisplayStatus] || statusConfig.CLEAN;
            const actions = statusActions[displayStatus] || [];

            return (
              <div className="space-y-4">
                {/* Current status */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estado Actual
                  </label>
                  <div className="mt-2">
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {/* Room info */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{selectedRoom.room_type?.name || "Standard"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Piso:</span>
                    <span className="font-medium">{selectedRoom.floor || "PB"}</span>
                  </div>
                </div>

                {/* Current guest if occupied */}
                {selectedRoom.current_guest && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">Ocupada</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedRoom.current_guest.name}</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Check-out: {new Date(selectedRoom.current_guest.check_out_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                {actions.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2">
                    {actions.map((a) => (
                      <Button
                        key={a.action}
                        variant="outline"
                        className="w-full"
                        disabled={statusChangeMutation.isPending}
                        onClick={() => statusChangeMutation.mutate({ roomId: selectedRoom.id, action: a.action })}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
