import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Facturación y Pagos</h1>
        <p className="text-muted-foreground">
          Gestión de folios, cargos y métodos de pago
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-billing/10 p-4 rounded-full">
            <CreditCard className="h-12 w-12 text-billing" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El módulo de Facturación incluirá gestión de folios, cargos adicionales, métodos de pago y generación de facturas.
          </p>
        </div>
      </Card>
    </div>
  );
}
