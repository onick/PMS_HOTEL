import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics e Inteligencia de Negocios</h1>
        <p className="text-muted-foreground">
          Reportes, métricas y análisis predictivo con IA
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-analytics/10 p-4 rounded-full">
            <BarChart3 className="h-12 w-12 text-analytics" />
          </div>
          <h2 className="text-xl font-semibold">Módulo en Desarrollo</h2>
          <p className="text-muted-foreground max-w-md">
            El módulo de Analytics incluirá dashboards interactivos, reportes de ocupación, RevPAR, ADR y análisis predictivo con inteligencia artificial.
          </p>
        </div>
      </Card>
    </div>
  );
}
