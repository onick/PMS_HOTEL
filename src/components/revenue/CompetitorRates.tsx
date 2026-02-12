import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  hotelId: string;
}

export default function CompetitorRates({ hotelId }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    competitor_name: "",
    room_category: "",
    price_cents: "",
    date: format(new Date(), "yyyy-MM-dd"),
    source: "manual",
  });

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("id, name, base_price_cents")
        .eq("hotel_id", hotelId);
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitor-rates", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_rates")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competitor_rates").insert({
        hotel_id: hotelId,
        competitor_name: form.competitor_name,
        room_category: form.room_category,
        price_cents: Math.round(Number(form.price_cents) * 100),
        date: form.date,
        source: form.source,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-rates"] });
      toast.success("Tarifa de competidor agregada");
      setOpen(false);
      setForm({
        competitor_name: "",
        room_category: "",
        price_cents: "",
        date: format(new Date(), "yyyy-MM-dd"),
        source: "manual",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Group by competitor for summary
  const competitorSummary = competitors?.reduce(
    (acc, rate) => {
      if (!acc[rate.competitor_name]) {
        acc[rate.competitor_name] = { count: 0, avgPrice: 0, total: 0 };
      }
      acc[rate.competitor_name].count++;
      acc[rate.competitor_name].total += rate.price_cents;
      acc[rate.competitor_name].avgPrice =
        acc[rate.competitor_name].total / acc[rate.competitor_name].count;
      return acc;
    },
    {} as Record<string, { count: number; avgPrice: number; total: number }>,
  );

  const getComparisonIcon = (competitorPrice: number, ourPrice: number) => {
    if (competitorPrice > ourPrice * 1.05)
      return <TrendingUp className="h-4 w-4 text-success" />;
    if (competitorPrice < ourPrice * 0.95)
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {competitorSummary && Object.keys(competitorSummary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(competitorSummary).slice(0, 3).map(([name, data]) => (
            <Card key={name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-channel-manager" />
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(data.avgPrice / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio de {data.count} registros
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rates Table */}
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Competidor</Label>
                    <Input
                      required
                      placeholder="Ej: Hilton Downtown"
                      value={form.competitor_name}
                      onChange={(e) =>
                        setForm({ ...form, competitor_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría de Habitación</Label>
                    <Select
                      value={form.room_category}
                      onValueChange={(val) =>
                        setForm({ ...form, room_category: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes?.map((rt) => (
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
                        required
                        min="0"
                        step="0.01"
                        placeholder="149.99"
                        value={form.price_cents}
                        onChange={(e) =>
                          setForm({ ...form, price_cents: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) =>
                          setForm({ ...form, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending ? "Guardando..." : "Agregar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando...</p>
          ) : !competitors?.length ? (
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
                  <TableHead>vs Nuestro</TableHead>
                  <TableHead>Fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((rate) => {
                  const ourType = roomTypes?.find(
                    (rt) => rt.name === rate.room_category,
                  );
                  const ourPrice = ourType?.base_price_cents || 0;

                  return (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        {rate.competitor_name}
                      </TableCell>
                      <TableCell>{rate.room_category}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(rate.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(rate.price_cents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ourPrice > 0 ? (
                            <>
                              {getComparisonIcon(rate.price_cents, ourPrice)}
                              <span className="text-sm">
                                {Math.round(
                                  ((rate.price_cents - ourPrice) / ourPrice) * 100,
                                )}
                                %
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rate.source || "manual"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
