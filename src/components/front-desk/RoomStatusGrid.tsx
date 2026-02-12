import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpen, Bed, User, Calendar, AlertCircle, CheckCircle2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RoomStatusCard } from "@/components/dashboard/RoomStatusCard";

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
  // Agregar estados adicionales para compatibilidad
  AVAILABLE: {
    label: "Disponible",
    color: "bg-success hover:bg-success/80",
    border: "border-success/50",
    icon: CheckCircle2,
  },
  OCCUPIED: {
    label: "Ocupada",
    color: "bg-primary hover:bg-primary/80",
    border: "border-primary/50",
    icon: User,
  },
  CLEANING: {
    label: "Limpiando",
    color: "bg-secondary hover:bg-secondary/80",
    border: "border-secondary/50",
    icon: User,
  },
  MAINTENANCE: {
    label: "Mantenimiento",
    color: "bg-destructive hover:bg-destructive/80",
    border: "border-destructive/50",
    icon: Wrench,
  },
} as const;

interface Room {
  id: string;
  room_number: string;
  status: keyof typeof statusConfig;
  floor: number;
  room_types?: { name: string };
  notes?: string;
  last_cleaned_at?: string;
}

interface Reservation {
  id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  status: string;
  guests?: { first_name: string; last_name: string };
}

export default function RoomStatusGrid({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms-status-grid", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", hotelId)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data as Room[];
    },
  });

  // Obtener reservas actuales para la habitación seleccionada
  const { data: currentReservation } = useQuery({
    queryKey: ["room-reservation", selectedRoom?.id],
    enabled: !!selectedRoom?.id,
    queryFn: async () => {
      if (!selectedRoom?.id) return null;

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          guest_id,
          check_in,
          check_out,
          status,
          guests (first_name, last_name)
        `)
        .eq("room_id", selectedRoom.id)
        .eq("status", "CHECKED_IN")
        .lte("check_in", now)
        .gte("check_out", now)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as Reservation | null;
    },
  });

  // Agrupar por piso
  const roomsByFloor = rooms?.reduce((acc: any, room: Room) => {
    const floor = room.floor || 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  const statusStats = rooms?.reduce((acc: any, room: Room) => {
    const status = room.status || "CLEAN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const updateStatusMutation = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: string }) => {
      const update: any = { status };
      if (status === "CLEAN") {
        update.last_cleaned_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("rooms")
        .update(update)
        .eq("id", roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      toast.success("Estado actualizado correctamente");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  const handleStatusChange = (status: string) => {
    if (selectedRoom) {
      updateStatusMutation.mutate({
        roomId: selectedRoom.id,
        status
      });
      setSelectedRoom({ ...selectedRoom, status: status as keyof typeof statusConfig });
    }
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
          {/* Resumen de estados - solo muestra estados que existen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(statusConfig)
              .filter(([status]) => (statusStats?.[status] || 0) > 0)
              .map(([status, config]) => {
              const Icon = config.icon;
              const count = statusStats?.[status] || 0;
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

          {/* Grid de habitaciones por piso */}
          <div className="space-y-6">
            {roomsByFloor && Object.entries(roomsByFloor)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([floor, floorRooms]: [string, any]) => (
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
                      const config = statusConfig[room.status] || statusConfig.CLEAN;
                      const Icon = config?.icon || CheckCircle2;
                      return (
                        <RoomStatusCard
                          key={room.id}
                          roomNumber={room.room_number}
                          type={room.room_types?.name || "Standard"}
                          status={room.status as any}
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

      {/* Modal de detalles de habitación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Habitación {selectedRoom?.room_number}
            </DialogTitle>
            <DialogDescription>
              Ver y modificar el estado de la habitación y sus detalles
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              {/* Estado actual */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Estado Actual
                </label>
                <div className="mt-2">
                  <Select
                    value={selectedRoom.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Información de la habitación */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{selectedRoom.room_types?.name || "Standard"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Piso:</span>
                  <span className="font-medium">{selectedRoom.floor || "PB"}</span>
                </div>
                {selectedRoom.last_cleaned_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Última limpieza:</span>
                    <span className="font-medium text-xs">
                      {new Date(selectedRoom.last_cleaned_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Huésped actual si hay reserva activa */}
              {currentReservation && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Ocupada</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {currentReservation.guests?.first_name} {currentReservation.guests?.last_name}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Check-out: {new Date(currentReservation.check_out).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Abrir modal de reporte de incidencia para esta habitación
                    toast.info("Función próximamente");
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reportar Incidencia
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

