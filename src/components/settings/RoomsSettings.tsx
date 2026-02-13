import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: number;
  number: string;
  floor: string;
  room_type: {
    id: number;
    name: string;
    code: string;
  } | null;
  occupancy_status: string;
  housekeeping_status: string;
}

export function RoomsSettings() {
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    number: "",
    room_type_id: "",
    floor: "1",
  });

  const queryClient = useQueryClient();

  // Fetch room types from Laravel
  const { data: roomTypes } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return res.data as Array<{ id: number; name: string; code: string }>;
    },
  });

  // Fetch rooms from Laravel
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms-settings"],
    queryFn: async () => {
      const res = await api.getRooms();
      return res.data as Room[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.createRoom({
        number: data.number,
        room_type_id: parseInt(data.room_type_id),
        floor: data.floor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Habitación creada exitosamente");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear habitación");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return api.updateRoom(data.id, {
        number: data.number,
        room_type_id: parseInt(data.room_type_id),
        floor: data.floor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Habitación actualizada exitosamente");
      setOpen(false);
      setEditingRoom(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar habitación");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.deleteRoom(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Habitación eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar habitación. Puede tener reservas asociadas.");
    },
  });

  const resetForm = () => {
    setFormData({ number: "", room_type_id: "", floor: "1" });
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number,
      room_type_id: room.room_type?.id?.toString() || "",
      floor: room.floor,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      updateMutation.mutate({ ...formData, id: editingRoom.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta habitación?")) {
      deleteMutation.mutate(id);
    }
  };

  const getOccupancyColor = (status: string) => {
    switch (status) {
      case "VACANT": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "OCCUPIED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "BLOCKED": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getHousekeepingColor = (status: string) => {
    switch (status) {
      case "CLEAN": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "DIRTY": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "INSPECTING": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "OUT_OF_ORDER": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Habitaciones
            </CardTitle>
            <CardDescription>
              Gestiona las habitaciones físicas de tu hotel
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditingRoom(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Habitación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoom ? "Editar Habitación" : "Nueva Habitación"}</DialogTitle>
                <DialogDescription>{editingRoom ? "Modifica" : "Crea"} una habitación física</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número de Habitación</Label>
                  <Input id="number" required placeholder="Ej: 101, 201A"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_type_id">Tipo de Habitación</Label>
                  <Select value={formData.room_type_id}
                    onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                    <SelectContent>
                      {roomTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Piso</Label>
                  <Input id="floor" required placeholder="Ej: 1, 2, 3"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingRoom ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando habitaciones...</p>
        ) : !rooms?.length ? (
          <p className="text-center text-muted-foreground py-8">No hay habitaciones configuradas. Crea una nueva.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Housekeeping</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.number}</TableCell>
                  <TableCell>{room.room_type?.name || "Sin tipo"}</TableCell>
                  <TableCell>Piso {room.floor}</TableCell>
                  <TableCell>
                    <Badge className={getOccupancyColor(room.occupancy_status)}>{room.occupancy_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getHousekeepingColor(room.housekeeping_status)}>{room.housekeeping_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(room.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
