import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react";

export default function GDPRRequests() {
  // TODO: Wire up when backend GDPR/data requests endpoint is available
  const requests: any[] = [];
  const isLoading = false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Solicitudes RGPD
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gestión de derechos de los titulares de datos (Artículos 15-22 RGPD)
          </p>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes RGPD
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Derechos RGPD Implementados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Derecho de Acceso (Art. 15)</h4>
              <p className="text-sm text-muted-foreground">
                Los huéspedes pueden solicitar una copia de todos sus datos personales.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Derecho de Rectificación (Art. 16)</h4>
              <p className="text-sm text-muted-foreground">
                Corrección de datos inexactos o incompletos.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Derecho al Olvido (Art. 17)</h4>
              <p className="text-sm text-muted-foreground">
                Supresión de datos cuando ya no sean necesarios.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Derecho a la Portabilidad (Art. 20)</h4>
              <p className="text-sm text-muted-foreground">
                Exportación de datos en formato estructurado (JSON/CSV).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
