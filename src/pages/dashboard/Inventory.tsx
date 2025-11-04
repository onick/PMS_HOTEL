import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Package, AlertTriangle, TrendingDown, Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { InventoryMovementDialog } from "@/components/inventory/InventoryMovementDialog";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "CLEANING",
    unit: "unit",
    current_stock: 0,
    min_stock: 10,
    unit_cost_cents: 0,
  });

  // Get hotel_id
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

  // Fetch inventory items
  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Add new item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      if (!userRoles?.hotel_id) throw new Error("No hotel ID");

      const { error } = await supabase
        .from("inventory_items")
        .insert({
          hotel_id: userRoles.hotel_id,
          ...item,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Artículo agregado correctamente");
      setDialogOpen(false);
      setNewItem({
        name: "",
        category: "CLEANING",
        unit: "unit",
        current_stock: 0,
        min_stock: 10,
        unit_cost_cents: 0,
      });
    },
    onError: () => {
      toast.error("Error al agregar artículo");
    },
  });

  // Filter items
  const filteredItems = items?.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const stats = {
    total: items?.length || 0,
    lowStock: items?.filter((item) => item.current_stock <= item.min_stock).length || 0,
    outOfStock: items?.filter((item) => item.current_stock === 0).length || 0,
    totalValue: items?.reduce((sum, item) => sum + (item.current_stock * item.unit_cost_cents), 0) || 0,
  };

  const categories = [
    { value: "CLEANING", label: "Limpieza" },
    { value: "MINIBAR", label: "Minibar" },
    { value: "AMENITIES", label: "Amenities" },
    { value: "LINENS", label: "Ropa de Cama" },
    { value: "MAINTENANCE", label: "Mantenimiento" },
    { value: "OFFICE", label: "Oficina" },
    { value: "OTHER", label: "Otro" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventario & Suministros</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventario & Suministros</h1>
          <p className="text-muted-foreground">
            Control de stock y gestión de suministros
          </p>
        </div>
        {userRoles?.hotel_id && (
          <PermissionGuard module="inventory" action="create" hotelId={userRoles.hotel_id}>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Artículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Artículo</DialogTitle>
                  <DialogDescription>
                    Agregar un nuevo artículo al inventario
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Ej: Shampoo, Toalla, Detergente..."
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unidad</Label>
                      <Select
                        value={newItem.unit}
                        onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">Unidad</SelectItem>
                          <SelectItem value="box">Caja</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="liter">Litro</SelectItem>
                          <SelectItem value="pack">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stock Actual</Label>
                      <Input
                        type="number"
                        value={newItem.current_stock}
                        onChange={(e) => setNewItem({ ...newItem, current_stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Stock Mínimo</Label>
                      <Input
                        type="number"
                        value={newItem.min_stock}
                        onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Costo Unitario ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(newItem.unit_cost_cents / 100).toFixed(2)}
                        onChange={(e) => setNewItem({ ...newItem, unit_cost_cents: Math.round(parseFloat(e.target.value) * 100) })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => addItemMutation.mutate(newItem)}
                    disabled={!newItem.name || addItemMutation.isPending}
                    className="w-full"
                  >
                    Agregar Artículo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Artículos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-orange-500">{stats.lowStock}</div>
              {stats.lowStock > 0 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agotados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-destructive">{stats.outOfStock}</div>
              {stats.outOfStock > 0 && <TrendingDown className="h-5 w-5 text-destructive" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(stats.totalValue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Artículos en Inventario</CardTitle>
          <CardDescription>
            {filteredItems?.length || 0} artículos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!filteredItems?.length ? (
              <p className="text-center text-muted-foreground py-8">
                No hay artículos en el inventario
              </p>
            ) : (
              filteredItems.map((item) => {
                const stockLevel = item.current_stock <= 0 ? "out" : item.current_stock <= item.min_stock ? "low" : "ok";
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {categories.find((c) => c.value === item.category)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.current_stock} {item.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {item.min_stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.unit_cost_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          por {item.unit}
                        </p>
                      </div>
                      <Badge
                        variant={stockLevel === "out" ? "destructive" : stockLevel === "low" ? "secondary" : "default"}
                      >
                        {stockLevel === "out" ? "Agotado" : stockLevel === "low" ? "Stock Bajo" : "OK"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setMovementDialogOpen(true);
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Movimiento
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement Dialog */}
      <InventoryMovementDialog
        item={selectedItem}
        open={movementDialogOpen}
        onClose={() => {
          setMovementDialogOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
