import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Package, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Material {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

const MATERIAL_CATEGORIES = [
  { value: "CLEANING", label: "Limpieza" },
  { value: "LINENS", label: "Lencería" },
  { value: "AMENITIES", label: "Amenities" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "OTHER", label: "Otro" },
];

const UNIT_OPTIONS = [
  { value: "unit", label: "Unidades" },
  { value: "box", label: "Cajas" },
  { value: "pack", label: "Paquetes" },
  { value: "kg", label: "Kg" },
  { value: "liter", label: "Litros" },
];

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as {
    message?: string;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };

  const validationMessage = maybeError.data?.errors
    ? Object.values(maybeError.data.errors).flat().find(Boolean)
    : null;

  return validationMessage || maybeError.data?.message || maybeError.message || fallback;
};

export default function MaterialsInventory() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "CLEANING",
    current_stock: "0",
    min_stock: "10",
    unit: "unit",
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["housekeeping-materials"],
    queryFn: async () => {
      const res = await api.getInventoryItems();
      const items = (res.data || []) as Material[];
      return items.filter((item) =>
        ["CLEANING", "LINENS", "AMENITIES", "MAINTENANCE", "OTHER"].includes(item.category),
      );
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async () =>
      api.createInventoryItem({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        current_stock: Number(formData.current_stock) || 0,
        min_stock: Number(formData.min_stock) || 0,
        unit_cost_cents: 0,
      }),
    onMutate: () => {
      toast.loading("Guardando material...", {
        id: "materials-create",
        description: "Creando registro en inventario.",
      });
    },
    onSuccess: () => {
      toast.success("Material agregado", {
        id: "materials-create",
        description: "El material ya está disponible en inventario.",
        duration: 3500,
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        category: "CLEANING",
        current_stock: "0",
        min_stock: "10",
        unit: "unit",
      });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-materials"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: unknown) => {
      toast.error("No se pudo guardar el material", {
        id: "materials-create",
        description: getApiErrorMessage(error, "Intenta nuevamente en unos segundos."),
        duration: 5000,
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ itemId, delta, itemName }: { itemId: number; delta: number; itemName: string }) =>
      api.createInventoryMovement(itemId, {
        movement_type: delta > 0 ? "PURCHASE" : "USAGE",
        quantity: delta,
        notes: "Ajuste rápido desde Housekeeping",
      }),
    onMutate: ({ delta, itemName }) => {
      toast.loading("Actualizando stock...", {
        id: "materials-stock-update",
        description: `${delta > 0 ? "Sumando" : "Restando"} 1 a ${itemName}.`,
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Stock actualizado", {
        id: "materials-stock-update",
        description: `${variables.delta > 0 ? "Se agregó" : "Se descontó"} 1 ${variables.itemName}.`,
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-materials"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: unknown) => {
      toast.error("No se pudo actualizar el stock", {
        id: "materials-stock-update",
        description: getApiErrorMessage(error, "Verifica permisos o conexión e intenta de nuevo."),
        duration: 5000,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario de Materiales
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Ej: Toallas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createMaterialMutation.mutate()}
                  disabled={!formData.name || createMaterialMutation.isPending}
                  className="w-full"
                >
                  Guardar Material
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium">No hay materiales registrados</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza agregando materiales al inventario
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => {
              const isLowStock = material.current_stock <= material.min_stock;
              const isCritical = material.current_stock < material.min_stock;

              return (
                <div
                  key={material.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCritical
                      ? "border-destructive bg-destructive/10 shadow-md"
                      : isLowStock
                      ? "border-warning bg-warning/5"
                      : "border-border hover:bg-muted/50"
                  } transition-all`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{material.name}</h4>
                        {isCritical && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ¡Crítico!
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {material.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStockMutation.mutate({
                            itemId: material.id,
                            delta: -1,
                            itemName: material.name,
                          })
                        }
                        disabled={updateStockMutation.isPending || material.current_stock <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold min-w-[90px] text-center">
                        {material.current_stock} {material.unit}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStockMutation.mutate({
                            itemId: material.id,
                            delta: 1,
                            itemName: material.name,
                          })
                        }
                        disabled={updateStockMutation.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Mín: {material.min_stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
