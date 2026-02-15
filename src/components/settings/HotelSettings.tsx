import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    currency: "",
    timezone: "",
    phone: "",
    email: "",
    check_in_time: "",
    check_out_time: "",
  });

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: async () => {
      const response = await api.getHotel();
      return response.data;
    },
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || "",
        address: hotel.address || "",
        city: hotel.city || "",
        country: hotel.country || "",
        currency: hotel.currency || "",
        timezone: hotel.timezone || "",
        phone: hotel.phone || "",
        email: hotel.email || "",
        check_in_time: normalizeTimeHHMM(hotel.check_in_time || ""),
        check_out_time: normalizeTimeHHMM(hotel.check_out_time || ""),
      });
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
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  <SelectItem value="DOP">DOP - Peso Dominicano</SelectItem>
                  <SelectItem value="USD">USD - Dólar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                </SelectContent>
              </Select>
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
      </CardContent>
    </Card>
  );
}
