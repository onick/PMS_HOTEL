import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  hotelId: string;
}

interface CompetitorRateForm {
  competitor_name: string;
  room_type_description: string;
  price: string;
  date: string;
}

export default function CompetitorRates({ hotelId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompetitorRateForm>({
    competitor_name: "",
    room_type_description: "all",
    price: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types-revenue", hotelId],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return (res.data || []) as any[];
    },
    enabled: !!hotelId,
  });

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ["competitor-rates", hotelId],
    queryFn: async () => {
      const res = await api.getCompetitorRates({ limit: "200" });
      return (res.data || []) as any[];
    },
    enabled: !!hotelId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CompetitorRateForm) => {
      const numericPrice = Number(payload.price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        throw new Error("El precio debe ser mayor que cero");
      }

      return api.createCompetitorRate({
        competitor_name: payload.competitor_name.trim(),
        room_type_description:
          payload.room_type_description === "all" ? null : payload.room_type_description,
        date: payload.date,
        rate_cents: Math.round(numericPrice * 100),
        source: "MANUAL",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-rates", hotelId] });
      toast.success("Tarifa de competidor agregada");
      setOpen(false);
      setForm({
        competitor_name: "",
        room_type_description: "all",
        price: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || error?.message || "No se pudo agregar la tarifa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.deleteCompetitorRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-rates", hotelId] });
      toast.success("Tarifa eliminada");
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || error?.message || "No se pudo eliminar la tarifa");
    },
  });

  const handleCreate = () => {
    if (!form.competitor_name.trim()) {
      toast.error("El nombre del competidor es requerido");
      return;
    }
    if (!form.date) {
      toast.error("La fecha es requerida");
      return;
    }

    createMutation.mutate(form);
  };

  const formatRate = (cents: number, currency: string) =>
    new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((cents || 0) / 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-channel-manager" />
                Tarifas de Competidores
              </CardTitle>
              <CardDescription>
                Monitorea los precios de tu competencia para ajustar tu estrategia
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tarifa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Tarifa de Competidor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Competidor</Label>
                    <Input
                      placeholder="Ej: Hilton Downtown"
                      value={form.competitor_name}
                      onChange={(e) => setForm({ ...form, competitor_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría de Habitación</Label>
                    <Select
                      value={form.room_type_description}
                      onValueChange={(value) => setForm({ ...form, room_type_description: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">General</SelectItem>
                        {roomTypes?.map((rt: any) => (
                          <SelectItem key={rt.id} value={rt.name}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="149.99"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Guardando..." : "Agregar"}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando...</p>
          ) : competitors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay tarifas de competidores registradas. Agrega una para comenzar el análisis.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competidor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((rate: any) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.competitor_name}</TableCell>
                    <TableCell>{rate.room_type_description || "General"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(rate.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatRate(rate.rate_cents || 0, rate.currency || "USD")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {(rate.source || "MANUAL").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(rate.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
