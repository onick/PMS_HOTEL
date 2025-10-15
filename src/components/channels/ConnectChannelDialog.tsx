import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConnectChannelDialogProps {
  channel: {
    id: string;
    name: string;
    logo: string;
  } | null;
  open: boolean;
  onClose: () => void;
}

const channelFields: Record<string, Array<{ name: string; label: string; type: string; placeholder: string; help?: string }>> = {
  booking: [
    { name: "hotel_id", label: "Hotel ID", type: "text", placeholder: "12345", help: "ID del hotel en Booking.com" },
    { name: "api_key", label: "API Key", type: "password", placeholder: "••••••••", help: "Clave API de Booking.com" },
    { name: "api_secret", label: "API Secret", type: "password", placeholder: "••••••••" },
  ],
  airbnb: [
    { name: "listing_id", label: "Listing ID", type: "text", placeholder: "12345678", help: "ID de tu propiedad en Airbnb" },
    { name: "access_token", label: "Access Token", type: "password", placeholder: "••••••••", help: "Token de acceso OAuth" },
    { name: "calendar_url", label: "iCal URL", type: "text", placeholder: "https://...", help: "URL del calendario iCal" },
  ],
  expedia: [
    { name: "property_id", label: "Property ID", type: "text", placeholder: "12345", help: "ID de la propiedad en Expedia" },
    { name: "username", label: "Username", type: "text", placeholder: "usuario@hotel.com" },
    { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  ],
  default: [
    { name: "api_key", label: "API Key", type: "password", placeholder: "••••••••" },
    { name: "api_secret", label: "API Secret", type: "password", placeholder: "••••••••" },
  ],
};

export default function ConnectChannelDialog({ channel, open, onClose }: ConnectChannelDialogProps) {
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const fields = channel ? (channelFields[channel.id] || channelFields.default) : [];

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!channel) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) throw new Error("No hotel encontrado");

      // Verificar si ya existe una conexión
      const { data: existing } = await supabase
        .from("channel_connections")
        .select("id")
        .eq("hotel_id", userRoles.hotel_id)
        .eq("channel_id", channel.id)
        .single();

      if (existing) {
        // Actualizar conexión existente
        const { error } = await supabase
          .from("channel_connections")
          .update({
            credentials: credentials,
            status: "connected",
            settings: { notes },
            last_sync_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Crear nueva conexión
        const { error } = await supabase
          .from("channel_connections")
          .insert({
            hotel_id: userRoles.hotel_id,
            channel_id: channel.id,
            channel_name: channel.name,
            credentials: credentials,
            status: "connected",
            settings: { notes },
            last_sync_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Canal ${channel?.name} conectado exitosamente`);
      setCredentials({});
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["channel-connections"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error("Error al conectar canal: " + error.message);
    },
  });

  const handleConnect = () => {
    // Validar que todos los campos requeridos estén llenos
    const missingFields = fields.filter(f => !credentials[f.name]);
    if (missingFields.length > 0) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    connectMutation.mutate();
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{channel.logo}</span>
            Conectar {channel.name}
          </DialogTitle>
          <DialogDescription>
            Ingresa las credenciales de tu cuenta para conectar este canal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={credentials[field.name] || ""}
                onChange={(e) =>
                  setCredentials({ ...credentials, [field.name]: e.target.value })
                }
              />
              {field.help && (
                <p className="text-xs text-muted-foreground">{field.help}</p>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional sobre esta conexión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🔒 Tus credenciales se almacenan de forma segura y solo se usan para sincronizar inventario y reservas con {channel.name}.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            className="bg-channel-manager hover:bg-channel-manager/90"
          >
            {connectMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Conectar Canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
