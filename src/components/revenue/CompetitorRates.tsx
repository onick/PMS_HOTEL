import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  hotelId: string;
}

export default function CompetitorRates({ hotelId }: Props) {
  const [open, setOpen] = useState(false);

  const { data: roomTypes } = useQuery({
    queryKey: ["room-types-revenue", hotelId],
    queryFn: async () => {
      const res = await api.getRoomTypes();
      return (res.data || []) as any[];
    },
    enabled: !!hotelId,
  });

  // TODO: Wire up when backend competitor_rates endpoint is available
  const competitors: any[] = [];
  const isLoading = false;

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
                    <Input placeholder="Ej: Hilton Downtown" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría de Habitación</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <Input type="number" min="0" step="0.01" placeholder="149.99" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        toast.info("Tarifas de competidores próximamente disponible");
                        setOpen(false);
                      }}
                    >
                      Agregar
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((rate: any) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.competitor_name}</TableCell>
                    <TableCell>{rate.room_category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(rate.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(rate.price_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {rate.source || "manual"}
                      </Badge>
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
