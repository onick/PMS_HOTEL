import { Card } from "@/components/ui/card";
import { BedDouble } from "lucide-react";

export default function Housekeeping() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Housekeeping</h1>
        <p className="text-muted-foreground">
          Control de limpieza y mantenimiento de habitaciones
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-housekeeping/10 p-4 rounded-full">
            <BedDouble className="h-12 w-12 text-housekeeping" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El módulo de Housekeeping permitirá gestionar tareas de limpieza, asignaciones de camareras y estado de habitaciones.
          </p>
        </div>
      </Card>
    </div>
  );
}
