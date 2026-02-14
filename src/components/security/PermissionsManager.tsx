import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, Shield } from "lucide-react";

export default function PermissionsManager() {
  // Use the API permissions endpoint
  const { data: permissionsData } = useQuery({
    queryKey: ["api-permissions"],
    queryFn: async () => {
      const res = await api.getPermissions();
      return res.data;
    },
  });

  const roles = ["RECEPTION", "HOUSEKEEPING", "SALES", "MANAGER", "HOTEL_OWNER", "SUPER_ADMIN"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Matriz de Permisos por Rol
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema de control granular de acceso basado en roles
          </p>
        </CardHeader>
        <CardContent>
          {permissionsData ? (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Permisos del usuario actual:
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(permissionsData) && permissionsData.map((perm: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {typeof perm === 'string' ? perm : perm.name || perm.action || JSON.stringify(perm)}
                  </Badge>
                ))}
                {!Array.isArray(permissionsData) && (
                  <p className="text-xs text-muted-foreground">
                    Permisos cargados correctamente
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Cargando permisos...
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Descripción de Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">RECEPTION (Recepcionista)</h4>
              <p className="text-sm text-muted-foreground">
                Gestiona check-in/check-out de huéspedes, asigna habitaciones, registra pagos y visualiza reservas.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">HOUSEKEEPING (Limpieza)</h4>
              <p className="text-sm text-muted-foreground">
                Ve y actualiza el estado de limpieza y mantenimiento de habitaciones, recibe notificaciones de tareas pendientes.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">SALES (Ventas)</h4>
              <p className="text-sm text-muted-foreground">
                Gestiona reservas, tarifas, ofertas y canales de venta. Acceso a CRM para seguimiento de clientes.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">MANAGER (Supervisor/Gerente)</h4>
              <p className="text-sm text-muted-foreground">
                Visualiza reportes avanzados, estadísticas de ocupación, ingresos y puede aprobar o modificar operaciones clave.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">HOTEL_OWNER (Propietario)</h4>
              <p className="text-sm text-muted-foreground">
                Acceso total al hotel. Gestión de usuarios, configuración y permisos. Control completo del sistema.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">SUPER_ADMIN (Administrador)</h4>
              <p className="text-sm text-muted-foreground">
                Acceso completo a todos los módulos, configura el sistema, crea y administra usuarios, supervisa operaciones globales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
