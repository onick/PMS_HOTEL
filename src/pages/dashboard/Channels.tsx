import { Card } from "@/components/ui/card";
import { Network } from "lucide-react";

export default function Channels() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Channel Manager</h1>
        <p className="text-muted-foreground">
          Gestión de canales de distribución y OTAs
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-channel-manager/10 p-4 rounded-full">
            <Network className="h-12 w-12 text-channel-manager" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El Channel Manager permitirá conectar con Booking.com, Airbnb, Expedia y otros canales de distribución para gestionar inventario y tarifas centralizadamente.
          </p>
        </div>
      </Card>
    </div>
  );
}
