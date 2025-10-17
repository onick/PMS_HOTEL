import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  floor: number;
  status: string;
  created_at: string;
  room_types?: {
    name: string;
  };
}

export function RoomsSettings() {
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: "",
    room_type_id: "",
    floor: "1",
    status: "AVAILABLE",
  });

  const queryClient = useQueryClient();

  // Get hotel_id from user
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch room types
  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", userRoles?.hotel_id],
    queryFn: async () => {
      if (!userRoles?.hotel_id) return [];
      
      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!userRoles?.hotel_id,
  });

  // Fetch rooms
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms-settings", userRoles?.hotel_id],
    queryFn: async () => {
      if (!userRoles?.hotel_id) return [];
      
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
      return data as Room[];
    },
    enabled: !!userRoles?.hotel_id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!userRoles?.hotel_id) throw new Error("No hotel ID");
      
      const { error } = await supabase
        .from("rooms")
        .insert({
          hotel_id: userRoles.hotel_id,
          room_type_id: data.room_type_id,
          room_number: data.room_number,
          floor: parseInt(data.floor),
          status: data.status,
        });
      
      if (error) throw error;
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
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("rooms")
        .update({
          room_type_id: data.room_type_id,
          room_number: data.room_number,
          floor: parseInt(data.floor),
          status: data.status,
        })
        .eq("id", data.id);
      
      if (error) throw error;
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
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
    setFormData({
      room_number: "",
      room_type_id: "",
      floor: "1",
      status: "AVAILABLE",
    });
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type_id: room.room_type_id,
      floor: room.floor.toString(),
      status: room.status,
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

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de que desea eliminar esta habitación? Esto puede afectar las reservas existentes.")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "OCCUPIED":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "MAINTENANCE":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "OUT_OF_SERVICE":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponible";
      case "OCCUPIED":
        return "Ocupada";
      case "MAINTENANCE":
        return "Mantenimiento";
      case "OUT_OF_SERVICE":
        return "Fuera de Servicio";
      default:
        return status;
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
            if (!isOpen) {
              setEditingRoom(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Habitación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? "Editar Habitación" : "Nueva Habitación"}
                </DialogTitle>
                <DialogDescription>
                  {editingRoom ? "Modifica" : "Crea"} una habitación física
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number">Número de Habitación</Label>
                  <Input
                    id="room_number"
                    required
                    placeholder="Ej: 101, 201A"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_type_id">Tipo de Habitación</Label>
                  <Select
                    value={formData.room_type_id}
                    onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">Piso</Label>
                  <Input
                    id="floor"
                    type="number"
                    required
                    min="0"
                    placeholder="Ej: 1, 2, 3"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Disponible</SelectItem>
                      <SelectItem value="OCCUPIED">Ocupada</SelectItem>
                      <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">Fuera de Servicio</SelectItem>
                    </SelectContent>
                  </Select>
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
          <p className="text-center text-muted-foreground py-8">
            No hay habitaciones configuradas. Crea una nueva.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.room_number}</TableCell>
                  <TableCell>{room.room_types?.name || "Sin tipo"}</TableCell>
                  <TableCell>Piso {room.floor}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(room.status)}>
                      {getStatusLabel(room.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(room)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(room.id)}
                        disabled={deleteMutation.isPending}
                      >
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
