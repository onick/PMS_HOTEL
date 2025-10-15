import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CRM() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">CRM - Gestión de Clientes</h1>
        <p className="text-muted-foreground">
          Administración de huéspedes y programas de fidelización
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-crm/10 p-4 rounded-full">
            <Users className="h-12 w-12 text-crm" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El CRM permitirá gestionar base de datos de huéspedes, historial de estancias, preferencias y programas de lealtad.
          </p>
        </div>
      </Card>
    </div>
  );
}
