import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BedDouble } from "lucide-react";
import { toast } from "sonner";

interface RoomType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  base_rate_cents: number;
  base_occupancy: number;
  max_occupancy: number;
  amenities: string[] | null;
  is_active: boolean;
  rooms_count?: number;
}

export function RoomTypesSettings() {
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    base_rate: "",
    base_occupancy: "2",
    max_occupancy: "4",
  });

  const queryClient = useQueryClient();

  // Fetch hotel currency
  const { data: hotelData } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: async () => {
      const res = await api.getHotel();
      return res.data;
    },
  });
  const currency = hotelData?.currency || "USD";

  // Fetch room types from Laravel API
  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ["room-types-settings"],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return res.data as RoomType[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.createRoomType({
        name: data.name,
        code: data.code || data.name.substring(0, 3).toUpperCase(),
        description: data.description || null,
        base_rate_cents: Math.round(parseFloat(data.base_rate) * 100),
        base_occupancy: parseInt(data.base_occupancy),
        max_occupancy: parseInt(data.max_occupancy),
        currency,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types-settings"] });
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success("Tipo de habitación creado exitosamente");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear tipo de habitación");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return api.updateRoomType(data.id, {
        name: data.name,
        code: data.code,
        description: data.description || null,
        base_rate_cents: Math.round(parseFloat(data.base_rate) * 100),
        base_occupancy: parseInt(data.base_occupancy),
        max_occupancy: parseInt(data.max_occupancy),
        currency,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types-settings"] });
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success("Tipo de habitación actualizado exitosamente");
      setOpen(false);
      setEditingType(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar tipo de habitación");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.deleteRoomType(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types-settings"] });
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success("Tipo de habitación eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar tipo de habitación. Puede tener habitaciones asociadas.");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      base_rate: "",
      base_occupancy: "2",
      max_occupancy: "4",
    });
  };

  const handleEdit = (type: RoomType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || "",
      base_rate: (type.base_rate_cents / 100).toString(),
      base_occupancy: type.base_occupancy.toString(),
      max_occupancy: type.max_occupancy.toString(),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseOcc = parseInt(formData.base_occupancy) || 0;
    const maxOcc = parseInt(formData.max_occupancy) || 0;
    if (baseOcc > maxOcc) {
      toast.error("La ocupación máxima debe ser mayor o igual a la ocupación base");
      return;
    }
    if (editingType) {
      updateMutation.mutate({ ...formData, id: editingType.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este tipo de habitación? Esto puede afectar las reservas existentes.")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const parsedRate = parseFloat(formData.base_rate || "0");
  const parsedBaseOccupancy = parseInt(formData.base_occupancy || "0");
  const parsedMaxOccupancy = parseInt(formData.max_occupancy || "0");
  const hasOccupancyError = parsedBaseOccupancy > parsedMaxOccupancy;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isSubmitDisabled =
    isSubmitting ||
    !formData.name.trim() ||
    !formData.code.trim() ||
    !formData.base_rate.trim() ||
    Number.isNaN(parsedRate) ||
    parsedRate < 0 ||
    hasOccupancyError;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              Tipos de Habitaciones
            </CardTitle>
            <CardDescription>
              Gestiona los tipos de habitaciones de tu hotel
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingType(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "Editar Tipo de Habitación" : "Nuevo Tipo de Habitación"}
                </DialogTitle>
                <DialogDescription>
                  {editingType ? "Actualiza la configuración comercial y operativa del tipo" : "Define el tipo de habitación y su configuración base"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Datos básicos
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        required
                        placeholder="Ej: Doble Estándar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        required
                        placeholder="Ej: DBL"
                        maxLength={10}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                      <p className="text-xs text-muted-foreground">Código corto para tablas y reportes.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Aspectos destacados, amenities y notas de venta"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Configuración comercial
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_rate">Tarifa Base ({currency})</Label>
                    <Input
                      id="base_rate"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Ej: 1200"
                      value={formData.base_rate}
                      onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_occupancy">Ocupación Base</Label>
                      <Input
                        id="base_occupancy"
                        type="number"
                        required
                        min="1"
                        placeholder="Ej: 2"
                        value={formData.base_occupancy}
                        onChange={(e) => setFormData({ ...formData, base_occupancy: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_occupancy">Ocupación Máxima</Label>
                      <Input
                        id="max_occupancy"
                        type="number"
                        required
                        min="1"
                        placeholder="Ej: 4"
                        value={formData.max_occupancy}
                        onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
                      />
                    </div>
                  </div>
                  {hasOccupancyError && (
                    <p className="text-xs text-destructive">
                      La ocupación máxima debe ser mayor o igual a la ocupación base.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-3 text-sm">
                  <Badge variant="outline">
                    Tarifa: {Number.isFinite(parsedRate) ? formatCurrency(Math.round(parsedRate * 100)) : "-"}
                  </Badge>
                  <Badge variant="outline">
                    Ocupación: {parsedBaseOccupancy || 0} - {parsedMaxOccupancy || 0} pers.
                  </Badge>
                  <Badge variant="outline">
                    Código: {formData.code || "---"}
                  </Badge>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingType(null);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitDisabled}>
                    {isSubmitting ? "Guardando..." : editingType ? "Actualizar Tipo" : "Crear Tipo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando tipos de habitaciones...</p>
        ) : !roomTypes?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No hay tipos de habitaciones configurados. Crea uno nuevo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tarifa Base</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <Badge variant="outline">{type.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {type.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatCurrency(type.base_rate_cents)}
                    </Badge>
                  </TableCell>
                  <TableCell>{type.base_occupancy}-{type.max_occupancy} pers.</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
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
