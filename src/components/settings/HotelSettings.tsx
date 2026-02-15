import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api, { type HotelData } from "@/lib/api";

function normalizeTimeHHMM(value: string): string {
  // Backend/MySQL may send "HH:MM:SS"; `<input type="time">` and API validation expect "HH:MM".
  if (!value) return "";
  const m = value.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : value;
}

export function HotelSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    timezone: "",
    phone: "",
    email: "",
    check_in_time: "",
    check_out_time: "",
  });
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [pricingCurrency, setPricingCurrency] = useState<string>("");

  const [currencyWizardOpen, setCurrencyWizardOpen] = useState(false);
  const [wizardTargetCurrency, setWizardTargetCurrency] = useState<string>("");
  const [wizardRateMode, setWizardRateMode] = useState<"auto" | "manual">("auto");
  const [wizardManualRate, setWizardManualRate] = useState<string>("");
  const [wizardApplyTo, setWizardApplyTo] = useState({
    room_types: true,
    rates_by_day: true,
    promos_penalties: true,
  });
  const [wizardPreview, setWizardPreview] = useState<any>(null);

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: async () => {
      const response = await api.getHotel();
      return response.data;
    },
  });

  useEffect(() => {
    if (hotel) {
      const base = (hotel.base_currency || hotel.currency || "").toUpperCase();
      const pricing = (hotel.pricing_currency || hotel.base_currency || hotel.currency || "").toUpperCase();
      setFormData({
        name: hotel.name || "",
        address: hotel.address || "",
        city: hotel.city || "",
        country: hotel.country || "",
        timezone: hotel.timezone || "",
        phone: hotel.phone || "",
        email: hotel.email || "",
        check_in_time: normalizeTimeHHMM(hotel.check_in_time || ""),
        check_out_time: normalizeTimeHHMM(hotel.check_out_time || ""),
      });
      setBaseCurrency(base);
      setPricingCurrency(pricing);
      setWizardTargetCurrency(pricing);
    }
  }, [hotel]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Filter out empty strings so we don't overwrite with nulls
      const cleaned = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== ""));

      // Ensure time fields are always sent as "HH:MM" (some browsers/DB values include seconds).
      if (typeof cleaned.check_in_time === "string") {
        cleaned.check_in_time = normalizeTimeHHMM(cleaned.check_in_time);
      }
      if (typeof cleaned.check_out_time === "string") {
        cleaned.check_out_time = normalizeTimeHHMM(cleaned.check_out_time);
      }

      return api.updateHotel(cleaned);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["hotel-settings"] });
      toast.success(response.message || "Configuración actualizada correctamente");
    },
    onError: (error: any) => {
      console.error("Error updating hotel:", error);
      toast.error(error?.message || "Error al actualizar la configuración");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const previewCurrencyChange = useMutation({
    mutationFn: async () => {
      return api.previewPricingCurrencyChange({
        target_currency: wizardTargetCurrency,
        rate_mode: wizardRateMode,
        manual_rate: wizardRateMode === "manual" ? wizardManualRate : undefined,
        apply_to: wizardApplyTo,
      });
    },
    onSuccess: (res: any) => {
      setWizardPreview(res.data);
    },
    onError: (error: any) => {
      setWizardPreview(null);
      toast.error(error?.message || "No se pudo generar la previsualización");
    },
  });

  const applyCurrencyChange = useMutation({
    mutationFn: async () => {
      // Reuse the preview request_id for idempotency if available.
      const requestId = wizardPreview?.request_id;
      return api.applyPricingCurrencyChange({
        target_currency: wizardTargetCurrency,
        rate_mode: wizardRateMode,
        manual_rate: wizardRateMode === "manual" ? wizardManualRate : undefined,
        apply_to: wizardApplyTo,
        request_id: requestId,
      });
    },
    onSuccess: (res: any) => {
      const nextPricing = (res?.data?.hotel?.pricing_currency || wizardTargetCurrency || "").toUpperCase();
      setPricingCurrency(nextPricing);
      queryClient.invalidateQueries({ queryKey: ["hotel-settings"] });
      queryClient.invalidateQueries({ queryKey: ["room-types-settings"] });
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      toast.success(res?.message || "Moneda de tarifas actualizada");
      setCurrencyWizardOpen(false);
      setWizardPreview(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo aplicar el cambio de moneda");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Hotel</CardTitle>
        <CardDescription>
          Configura la información básica de tu hotel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Hotel</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="DO"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda base contable</Label>
              <Input value={baseCurrency || "-"} disabled />
              <p className="text-xs text-muted-foreground">
                Bloqueada en v1 (reportes, impuestos, balances, night audit).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Moneda de tarifas/venta</Label>
              <div className="flex items-center gap-2">
                <Input value={pricingCurrency || "-"} disabled />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrencyWizardOpen(true);
                    setWizardPreview(null);
                    setWizardTargetCurrency(pricingCurrency || baseCurrency || "USD");
                    setWizardRateMode("auto");
                    setWizardManualRate("");
                  }}
                >
                  Cambiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Se cambia por wizard (tasa del día + preview). No modifica folios/pagos/reservas existentes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Seleccionar zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Santo_Domingo">América/Santo Domingo</SelectItem>
                  <SelectItem value="America/New_York">América/New York</SelectItem>
                  <SelectItem value="America/Los_Angeles">América/Los Angeles</SelectItem>
                  <SelectItem value="America/Mexico_City">América/México City</SelectItem>
                  <SelectItem value="Europe/Madrid">Europa/Madrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_in_time">Hora de Check-in</Label>
              <Input
                id="check_in_time"
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_out_time">Hora de Check-out</Label>
              <Input
                id="check_out_time"
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>

        <Dialog open={currencyWizardOpen} onOpenChange={(open) => {
          setCurrencyWizardOpen(open);
          if (!open) setWizardPreview(null);
        }}>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle>Cambiar moneda de tarifas/venta</DialogTitle>
              <DialogDescription>
                Usa tasa del día (server-side) y convierte solo precios futuros. No altera folios, pagos ni reservas existentes.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Moneda objetivo</Label>
                <Select value={wizardTargetCurrency} onValueChange={(v) => setWizardTargetCurrency(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modo de tasa</Label>
                <Select value={wizardRateMode} onValueChange={(v) => setWizardRateMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automática (tasa del día)</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                {wizardRateMode === "manual" && (
                  <Input
                    placeholder="Ej: 60.00 (1 USD = 60 DOP)"
                    value={wizardManualRate}
                    onChange={(e) => setWizardManualRate(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="text-sm font-medium">Aplicar a</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={wizardApplyTo.room_types}
                    onCheckedChange={(checked) => setWizardApplyTo((s) => ({ ...s, room_types: Boolean(checked) }))}
                  />
                  <span>RoomType base rates</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={wizardApplyTo.rates_by_day}
                    onCheckedChange={(checked) => setWizardApplyTo((s) => ({ ...s, rates_by_day: Boolean(checked) }))}
                  />
                  <span>Rates by day</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={wizardApplyTo.promos_penalties}
                    onCheckedChange={(checked) => setWizardApplyTo((s) => ({ ...s, promos_penalties: Boolean(checked) }))}
                  />
                  <span>Promos/penalidades</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => previewCurrencyChange.mutate()}
                disabled={previewCurrencyChange.isPending || !wizardTargetCurrency}
              >
                {previewCurrencyChange.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Previsualizar
              </Button>
              {wizardPreview?.rate && (
                <div className="text-xs text-muted-foreground">
                  Tasa: 1 {wizardPreview.rate.quote_currency} = {wizardPreview.rate.rate} {wizardPreview.rate.base_currency}
                  {" · "}
                  Fuente: {wizardPreview.rate.source}
                </div>
              )}
            </div>

            {wizardPreview?.preview?.room_types?.items?.length ? (
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-2">Preview (muestra)</div>
                <div className="space-y-2">
                  {wizardPreview.preview.room_types.items.slice(0, 3).map((it: any) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{it.name}</span>
                      <span className="text-muted-foreground">
                        {it.from_cents / 100} {it.from_currency} → {it.to_cents / 100} {it.to_currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCurrencyWizardOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => applyCurrencyChange.mutate()}
                disabled={applyCurrencyChange.isPending || !wizardPreview}
              >
                {applyCurrencyChange.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar y aplicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
