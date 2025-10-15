import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Package, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit: string;
}

export default function MaterialsInventory() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    quantity: 0,
    min_quantity: 10,
    unit: "unidades"
  });

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("name");

      if (error) throw error;
      return data as Material[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { error } = await supabase
        .from("materials")
        .insert({ ...data, hotel_id: userRoles.hotel_id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setDialogOpen(false);
      setFormData({ name: "", category: "general", quantity: 0, min_quantity: 10, unit: "unidades" });
      toast({ title: "Material agregado correctamente" });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("materials")
        .update({ quantity })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  const lowStockMaterials = materials?.filter(m => m.quantity <= m.min_quantity) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario de Materiales
            {lowStockMaterials.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowStockMaterials.length} bajos
              </Badge>
            )}
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Toallas"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Lencería"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ej: unidades, litros, kg"
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending}
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
        ) : materials?.length === 0 ? (
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
            {materials?.map((material) => {
              const isLowStock = material.quantity <= material.min_quantity;
              const isCritical = material.quantity < material.min_quantity;
              
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
                        {isLowStock && !isCritical && (
                          <Badge variant="outline" className="text-xs bg-warning/20 border-warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stock bajo
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
                          updateQuantityMutation.mutate({
                            id: material.id,
                            quantity: Math.max(0, material.quantity - 1),
                          })
                        }
                        disabled={updateQuantityMutation.isPending || material.quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={`font-bold min-w-[60px] text-center ${
                        isCritical ? "text-destructive" : isLowStock ? "text-warning" : ""
                      }`}>
                        {material.quantity} {material.unit}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            id: material.id,
                            quantity: material.quantity + 1,
                          })
                        }
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Mín: {material.min_quantity}
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
