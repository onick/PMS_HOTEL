import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";

interface RatePlan {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

export function RatePlansSettings() {
  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_percentage: "0",
    is_active: true,
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

  // Fetch rate plans
  const { data: ratePlans, isLoading } = useQuery({
    queryKey: ["rate-plans", userRoles?.hotel_id],
    queryFn: async () => {
      if (!userRoles?.hotel_id) return [];
      
      const { data, error } = await supabase
        .from("rate_plans")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("name");
      
      if (error) throw error;
      return data as RatePlan[];
    },
    enabled: !!userRoles?.hotel_id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!userRoles?.hotel_id) throw new Error("No hotel ID");
      
      const { error } = await supabase
        .from("rate_plans")
        .insert({
          hotel_id: userRoles.hotel_id,
          name: data.name,
          description: data.description || null,
          discount_percentage: parseFloat(data.discount_percentage),
          is_active: data.is_active,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans"] });
      toast.success("Plan de tarifas creado exitosamente");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear plan de tarifas");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("rate_plans")
        .update({
          name: data.name,
          description: data.description || null,
          discount_percentage: parseFloat(data.discount_percentage),
          is_active: data.is_active,
        })
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans"] });
      toast.success("Plan de tarifas actualizado exitosamente");
      setOpen(false);
      setEditingPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar plan de tarifas");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rate_plans")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans"] });
      toast.success("Plan de tarifas eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar plan de tarifas");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discount_percentage: "0",
      is_active: true,
    });
  };

  const handleEdit = (plan: RatePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      discount_percentage: plan.discount_percentage.toString(),
      is_active: plan.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ ...formData, id: editingPlan.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de que desea eliminar este plan de tarifas?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Planes de Tarifas
            </CardTitle>
            <CardDescription>
              Gestiona los planes de tarifas de tu hotel (BAR, Early Bird, etc.)
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingPlan(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plan de Tarifas" : "Nuevo Plan de Tarifas"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? "Modifica" : "Crea"} un plan de tarifas para tu hotel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Plan</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Ej: Early Bird"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del plan"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ej: 15"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Plan activo</Label>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingPlan ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando planes de tarifas...</p>
        ) : !ratePlans?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No hay planes de tarifas configurados. Crea uno nuevo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratePlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {plan.discount_percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
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
