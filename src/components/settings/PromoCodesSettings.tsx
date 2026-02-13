import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  min_nights: number | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
}

export function PromoCodesSettings() {
  const [open, setOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: "0",
    valid_from: "",
    valid_until: "",
    min_nights: "",
    max_uses: "",
    is_active: true,
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

  // Fetch promo codes from Laravel API
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["promo-codes-settings"],
    queryFn: async () => {
      const res = await api.getPromoCodes();
      return res.data as PromoCode[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.createPromoCode({
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        min_nights: data.min_nights ? parseInt(data.min_nights) : null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        is_active: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-settings"] });
      toast.success("Código promocional creado exitosamente");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear código promocional");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      return api.updatePromoCode(data.id, {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        min_nights: data.min_nights ? parseInt(data.min_nights) : null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        is_active: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-settings"] });
      toast.success("Código promocional actualizado exitosamente");
      setOpen(false);
      setEditingCode(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar código promocional");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.deletePromoCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-settings"] });
      toast.success("Código promocional eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar código promocional");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "0",
      valid_from: "",
      valid_until: "",
      min_nights: "",
      max_uses: "",
      is_active: true,
    });
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      valid_from: code.valid_from || "",
      valid_until: code.valid_until || "",
      min_nights: code.min_nights?.toString() || "",
      max_uses: code.max_uses?.toString() || "",
      is_active: code.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCode) {
      updateMutation.mutate({ ...formData, id: editingCode.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este código promocional?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-DO");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Códigos Promocionales
            </CardTitle>
            <CardDescription>
              Gestiona códigos promocionales y ofertas especiales
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingCode(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Código
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCode ? "Editar Código Promocional" : "Nuevo Código Promocional"}
                </DialogTitle>
                <DialogDescription>
                  {editingCode ? "Modifica" : "Crea"} un código promocional para tu hotel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      required
                      placeholder="Ej: VERANO2024"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Tipo de Descuento</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: "percentage" | "fixed_amount") =>
                        setFormData({ ...formData, discount_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed_amount">Monto Fijo ({currency})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del código promocional"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor del Descuento ({formData.discount_type === "percentage" ? "%" : currency})
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.discount_type === "percentage" ? "Ej: 20" : "Ej: 500"}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valid_from">Válido Desde</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Válido Hasta</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
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
                    <Label htmlFor="max_uses">Usos Máximos</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Código activo</Label>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingCode ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando códigos promocionales...</p>
        ) : !promoCodes?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No hay códigos promocionales configurados. Crea uno nuevo.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {code.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {code.discount_type === "percentage"
                        ? `${code.discount_value}%`
                        : `$${Number(code.discount_value).toFixed(2)}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatDate(code.valid_from)}</div>
                    <div className="text-muted-foreground">hasta {formatDate(code.valid_until)}</div>
                  </TableCell>
                  <TableCell>
                    {code.max_uses
                      ? `${code.times_used}/${code.max_uses}`
                      : `${code.times_used}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.is_active ? "default" : "secondary"}>
                      {code.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(code)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(code.id)}
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
