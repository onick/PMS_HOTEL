import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";

type CancellationPolicyType = "FREE" | "NON_REFUNDABLE" | "PARTIAL";

interface RatePlan {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  includes_breakfast: boolean;
  is_refundable: boolean;
  valid_from: string | null;
  valid_until: string | null;
  min_nights: number | null;
  max_nights: number | null;
  cancellation_policy?: {
    type: string;
    deadline_hours: number;
    penalty_percent: number;
  } | null;
}

export function RatePlansSettings() {
  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_default: false,
    is_active: true,
    includes_breakfast: false,
    is_refundable: true,
    min_nights: "",
    max_nights: "",
    cancellation_type: "FREE" as CancellationPolicyType,
    cancellation_deadline_hours: "24",
    cancellation_penalty_percent: "",
  });

  const queryClient = useQueryClient();

  const buildCancellationPolicyPayload = (data: typeof formData) => {
    const type = data.cancellation_type;
    const deadlineHours = data.cancellation_deadline_hours
      ? parseInt(data.cancellation_deadline_hours, 10)
      : 24;

    if (type === "NON_REFUNDABLE") {
      return { type };
    }

    if (type === "PARTIAL") {
      const penaltyPercent = data.cancellation_penalty_percent
        ? Number(data.cancellation_penalty_percent)
        : 50;
      return {
        type,
        deadline_hours: deadlineHours,
        penalty_percent: penaltyPercent,
      };
    }

    return {
      type: "FREE" as CancellationPolicyType,
      deadline_hours: deadlineHours,
    };
  };

  // Fetch rate plans from Laravel API
  const { data: ratePlans, isLoading } = useQuery({
    queryKey: ["rate-plans-settings"],
    queryFn: async () => {
      const res = await api.getRatePlans();
      return res.data as RatePlan[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.createRatePlan({
        name: data.name,
        code: data.code || data.name.substring(0, 3).toUpperCase(),
        description: data.description || null,
        is_default: data.is_default,
        is_active: data.is_active,
        includes_breakfast: data.includes_breakfast,
        is_refundable: data.is_refundable,
        min_nights: data.min_nights ? parseInt(data.min_nights) : null,
        max_nights: data.max_nights ? parseInt(data.max_nights) : null,
        cancellation_policy: buildCancellationPolicyPayload(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans-settings"] });
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
    mutationFn: async (data: typeof formData & { id: number }) => {
      return api.updateRatePlan(data.id, {
        name: data.name,
        code: data.code,
        description: data.description || null,
        is_default: data.is_default,
        is_active: data.is_active,
        includes_breakfast: data.includes_breakfast,
        is_refundable: data.is_refundable,
        min_nights: data.min_nights ? parseInt(data.min_nights) : null,
        max_nights: data.max_nights ? parseInt(data.max_nights) : null,
        cancellation_policy: buildCancellationPolicyPayload(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans-settings"] });
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
    mutationFn: async (id: number) => {
      return api.deleteRatePlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-plans-settings"] });
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
      code: "",
      description: "",
      is_default: false,
      is_active: true,
      includes_breakfast: false,
      is_refundable: true,
      min_nights: "",
      max_nights: "",
      cancellation_type: "FREE",
      cancellation_deadline_hours: "24",
      cancellation_penalty_percent: "",
    });
  };

  const handleEdit = (plan: RatePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || "",
      is_default: plan.is_default,
      is_active: plan.is_active,
      includes_breakfast: plan.includes_breakfast,
      is_refundable: plan.is_refundable,
      min_nights: plan.min_nights?.toString() || "",
      max_nights: plan.max_nights?.toString() || "",
      cancellation_type: plan.cancellation_policy?.type || (plan.is_refundable ? "FREE" : "NON_REFUNDABLE"),
      cancellation_deadline_hours: plan.cancellation_policy?.deadline_hours?.toString() || "24",
      cancellation_penalty_percent: plan.cancellation_policy?.penalty_percent?.toString() || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.cancellation_type !== "NON_REFUNDABLE") {
      const deadline = Number(formData.cancellation_deadline_hours || "24");
      if (!Number.isFinite(deadline) || deadline < 0) {
        toast.error("La ventana de cancelación debe ser 0 o mayor");
        return;
      }
    }

    if (formData.cancellation_type === "PARTIAL") {
      const penalty = Number(formData.cancellation_penalty_percent);
      if (!Number.isFinite(penalty) || penalty <= 0 || penalty > 100) {
        toast.error("La penalidad debe ser mayor a 0 y menor o igual a 100%");
        return;
      }
    }

    if (editingPlan) {
      updateMutation.mutate({ ...formData, id: editingPlan.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      required
                      placeholder="Ej: EB"
                      maxLength={10}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_nights">Noches Mínimas</Label>
                    <Input
                      id="min_nights"
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={formData.min_nights}
                      onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_nights">Noches Máximas</Label>
                    <Input
                      id="max_nights"
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={formData.max_nights}
                      onChange={(e) => setFormData({ ...formData, max_nights: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Plan activo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <Label htmlFor="is_default">Plan por defecto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includes_breakfast"
                      checked={formData.includes_breakfast}
                      onCheckedChange={(checked) => setFormData({ ...formData, includes_breakfast: checked })}
                    />
                    <Label htmlFor="includes_breakfast">Incluye desayuno</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_refundable"
                      checked={formData.is_refundable}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_refundable: checked })}
                    />
                    <Label htmlFor="is_refundable">Reembolsable</Label>
                  </div>
                </div>

                <div className="space-y-3 border rounded-md p-4">
                  <Label className="text-sm font-medium">Política de Cancelación</Label>
                  <div className="space-y-2">
                    <Label htmlFor="cancellation_type">Tipo</Label>
                    <Select
                      value={formData.cancellation_type}
                      onValueChange={(value: CancellationPolicyType) => {
                        setFormData((prev) => ({
                          ...prev,
                          cancellation_type: value,
                          is_refundable: value !== "NON_REFUNDABLE",
                          cancellation_penalty_percent:
                            value === "PARTIAL" ? prev.cancellation_penalty_percent || "50" : "",
                        }));
                      }}
                    >
                      <SelectTrigger id="cancellation_type">
                        <SelectValue placeholder="Seleccionar política" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Cancelación gratis</SelectItem>
                        <SelectItem value="PARTIAL">Penalidad parcial</SelectItem>
                        <SelectItem value="NON_REFUNDABLE">No reembolsable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.cancellation_type !== "NON_REFUNDABLE" && (
                    <div className="space-y-2">
                      <Label htmlFor="cancellation_deadline_hours">Horas antes del check-in</Label>
                      <Input
                        id="cancellation_deadline_hours"
                        type="number"
                        min="0"
                        placeholder="24"
                        value={formData.cancellation_deadline_hours}
                        onChange={(e) =>
                          setFormData({ ...formData, cancellation_deadline_hours: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {formData.cancellation_type === "PARTIAL" && (
                    <div className="space-y-2">
                      <Label htmlFor="cancellation_penalty_percent">Penalidad (%)</Label>
                      <Input
                        id="cancellation_penalty_percent"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="50"
                        value={formData.cancellation_penalty_percent}
                        onChange={(e) =>
                          setFormData({ ...formData, cancellation_penalty_percent: e.target.value })
                        }
                      />
                    </div>
                  )}
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
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Opciones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratePlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Badge variant="outline">{plan.code}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {plan.name}
                    {plan.is_default && (
                      <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {plan.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {plan.includes_breakfast && (
                        <Badge variant="secondary" className="text-xs">Desayuno</Badge>
                      )}
                      {plan.is_refundable && (
                        <Badge variant="secondary" className="text-xs">Reembolsable</Badge>
                      )}
                      {plan.cancellation_policy?.type === "FREE" && (
                        <Badge variant="secondary" className="text-xs">Cancelación gratis</Badge>
                      )}
                      {plan.cancellation_policy?.type === "PARTIAL" && (
                        <Badge variant="secondary" className="text-xs">
                          Penalidad {plan.cancellation_policy.penalty_percent}%
                        </Badge>
                      )}
                      {plan.cancellation_policy?.type === "NON_REFUNDABLE" && (
                        <Badge variant="secondary" className="text-xs">No reembolsable</Badge>
                      )}
                      {plan.min_nights && (
                        <Badge variant="secondary" className="text-xs">Min {plan.min_nights}n</Badge>
                      )}
                    </div>
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
