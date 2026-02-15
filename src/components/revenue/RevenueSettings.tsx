import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Props {
  hotelId: string;
}

interface RevenueSettingsForm {
  enable_dynamic_pricing: boolean;
  occupancy_weight: number;
  competitor_weight: number;
  min_price_threshold_percent: number;
  max_price_threshold_percent: number;
}

export default function RevenueSettings({ hotelId }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RevenueSettingsForm>({
    enable_dynamic_pricing: false,
    occupancy_weight: 70,
    competitor_weight: 30,
    min_price_threshold_percent: 70,
    max_price_threshold_percent: 150,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["revenue-settings", hotelId],
    queryFn: async () => {
      const res = await api.getRevenueSettings();
      return res.data as Partial<RevenueSettingsForm>;
    },
    enabled: !!hotelId,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      enable_dynamic_pricing: Boolean(settings.enable_dynamic_pricing),
      occupancy_weight: Number(settings.occupancy_weight ?? 70),
      competitor_weight: Number(settings.competitor_weight ?? 30),
      min_price_threshold_percent: Number(settings.min_price_threshold_percent ?? 70),
      max_price_threshold_percent: Number(settings.max_price_threshold_percent ?? 150),
    });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: RevenueSettingsForm) => api.updateRevenueSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-settings", hotelId] });
      toast.success("Configuración guardada");
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || error?.message || "No se pudo guardar la configuración");
    },
  });

  const handleSave = () => {
    if (form.occupancy_weight + form.competitor_weight !== 100) {
      toast.error("Los pesos deben sumar 100%");
      return;
    }
    if (form.min_price_threshold_percent > form.max_price_threshold_percent) {
      toast.error("El mínimo no puede ser mayor que el máximo");
      return;
    }

    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-revenue" />
            Pricing Dinámico
          </CardTitle>
          <CardDescription>
            Ajusta automáticamente las tarifas basándose en ocupación y competencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Activar Pricing Dinámico</Label>
              <p className="text-sm text-muted-foreground">
                Las tarifas se ajustarán automáticamente según las reglas configuradas
              </p>
            </div>
            <Switch
              checked={form.enable_dynamic_pricing}
              onCheckedChange={(checked) =>
                setForm({ ...form, enable_dynamic_pricing: checked })
              }
              disabled={isLoading || updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Pesos del Algoritmo
          </CardTitle>
          <CardDescription>
            Define cuánto peso tiene cada factor en el cálculo de tarifas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Peso de Ocupación</Label>
              <span className="text-sm font-medium text-revenue">{form.occupancy_weight}%</span>
            </div>
            <Slider
              value={[form.occupancy_weight]}
              onValueChange={([val]) =>
                setForm({
                  ...form,
                  occupancy_weight: val,
                  competitor_weight: 100 - val,
                })
              }
              min={0}
              max={100}
              step={5}
              disabled={isLoading || updateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Mayor ocupación = tarifas más altas
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Peso de Competencia</Label>
              <span className="text-sm font-medium text-channel-manager">{form.competitor_weight}%</span>
            </div>
            <Slider
              value={[form.competitor_weight]}
              onValueChange={([val]) =>
                setForm({
                  ...form,
                  competitor_weight: val,
                  occupancy_weight: 100 - val,
                })
              }
              min={0}
              max={100}
              step={5}
              disabled={isLoading || updateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Ajusta según precios de competidores cercanos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Límites de Precio</CardTitle>
          <CardDescription>
            Rango permitido para ajustes automáticos (% sobre tarifa base)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-threshold">Mínimo (%)</Label>
              <Input
                id="min-threshold"
                type="number"
                min={30}
                max={100}
                value={form.min_price_threshold_percent}
                onChange={(e) =>
                  setForm({ ...form, min_price_threshold_percent: Number(e.target.value) })
                }
                disabled={isLoading || updateMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Nunca bajar de este % de la tarifa base
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-threshold">Máximo (%)</Label>
              <Input
                id="max-threshold"
                type="number"
                min={100}
                max={300}
                value={form.max_price_threshold_percent}
                onChange={(e) =>
                  setForm({ ...form, max_price_threshold_percent: Number(e.target.value) })
                }
                disabled={isLoading || updateMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Nunca subir más de este % de la tarifa base
              </p>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isLoading || updateMutation.isPending}>
            {updateMutation.isPending ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
