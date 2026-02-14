import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useConnectChannel } from "@/hooks/useChannels";

interface Props {
  channelCode: string | null;
  channelMeta: { logo: string; label: string; color: string } | null;
  open: boolean;
  onClose: () => void;
}

const channelFields: Record<string, Array<{ name: string; label: string; type: string; placeholder: string; help?: string }>> = {
  BOOKING_COM: [
    { name: "hotel_id", label: "Hotel ID", type: "text", placeholder: "12345", help: "ID del hotel en Booking.com" },
    { name: "api_key", label: "API Key", type: "password", placeholder: "••••••••" },
    { name: "api_secret", label: "API Secret", type: "password", placeholder: "••••••••" },
  ],
  AIRBNB: [
    { name: "listing_id", label: "Listing ID", type: "text", placeholder: "12345678" },
    { name: "access_token", label: "Access Token", type: "password", placeholder: "••••••••" },
  ],
  EXPEDIA: [
    { name: "property_id", label: "Property ID", type: "text", placeholder: "12345" },
    { name: "username", label: "Username", type: "text", placeholder: "usuario@hotel.com" },
    { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  ],
};

const DEFAULT_FIELDS = [
  { name: "api_key", label: "API Key", type: "password", placeholder: "••••••••" },
  { name: "api_secret", label: "API Secret", type: "password", placeholder: "••••••••" },
];

export default function ConnectChannelDialog({ channelCode, channelMeta, open, onClose }: Props) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const connectMutation = useConnectChannel();

  const fields = channelCode ? (channelFields[channelCode] ?? DEFAULT_FIELDS) : [];

  const handleConnect = () => {
    if (!channelCode) return;
    connectMutation.mutate(
      { channel: channelCode, credentials },
      {
        onSuccess: () => {
          setCredentials({});
          onClose();
        },
      }
    );
  };

  if (!channelCode || !channelMeta) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{channelMeta.logo}</span>
            Conectar {channelMeta.label}
          </DialogTitle>
          <DialogDescription>
            Ingresa las credenciales API para conectar este canal
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

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🔒 Las credenciales se encriptan y solo se usan para sincronizar con {channelMeta.label}.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            variant="default"
          >
            {connectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Conectar Canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
