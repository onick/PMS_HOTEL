import { Card } from "@/components/ui/card";
import { Hotel } from "lucide-react";

export default function FrontDesk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Front Desk</h1>
        <p className="text-muted-foreground">
          Gestión de check-in, check-out y asignación de habitaciones
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-front-desk/10 p-4 rounded-full">
            <Hotel className="h-12 w-12 text-front-desk" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El módulo de Front Desk estará disponible próximamente con funcionalidades de check-in/out, asignación de habitaciones y registro de huéspedes.
          </p>
        </div>
      </Card>
    </div>
  );
}
