import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DataAccessLogs() {
  // TODO: Wire up when backend data access logs endpoint is available
  const logs: any[] = [];
  const isLoading = false;

  const dataTypeConfig: Record<string, { color: string; label: string }> = {
    personal_info: { color: "bg-primary", label: "Datos Personales" },
    payment_info: { color: "bg-destructive", label: "Datos de Pago" },
    preferences: { color: "bg-channels", label: "Preferencias" },
    booking_history: { color: "bg-front-desk", label: "Historial" },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-2">
              <UserCheck className="h-5 w-5" />
              Registro de Acceso a Datos Personales (RGPD)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cumplimiento del Artículo 30 RGPD - Registro de actividades de tratamiento
            </p>
          </div>
          <Button size="sm" variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay registros de acceso
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <Badge variant="outline" className={dataTypeConfig[log.data_type]?.color || ""}>
                        {dataTypeConfig[log.data_type]?.label || log.data_type}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Propósito:</span> {log.purpose}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
