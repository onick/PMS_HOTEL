import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PermissionsManager() {
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module")
        .order("action");

      if (error) throw error;
      return data;
    },
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select(`
          *,
          permission:permission_id(module, action, resource, description)
        `);

      if (error) throw error;
      return data;
    },
  });

  // Agrupar permisos por módulo
  const groupedPermissions = permissions?.reduce((acc: any, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Verificar si un rol tiene un permiso
  const roleHasPermission = (role: string, permId: string) => {
    return rolePermissions?.some(
      (rp: any) => rp.role === role && rp.permission_id === permId
    );
  };

  const roles = ["RECEPTION", "HOUSEKEEPING", "SALES", "MANAGER", "HOTEL_OWNER", "SUPER_ADMIN"];

  const moduleIcons: Record<string, any> = {
    reservations: "📅",
    crm: "👥",
    billing: "💰",
    housekeeping: "🧹",
    admin: "⚙️",
  };

  const actionColors: Record<string, string> = {
    create: "bg-success",
    read: "bg-front-desk",
    update: "bg-warning",
    delete: "bg-destructive",
    export: "bg-channels",
    assign: "bg-primary",
    manage: "bg-purple-500",
  };

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
          {Object.entries(groupedPermissions || {}).map(([module, perms]: [string, any]) => (
            <div key={module} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">{moduleIcons[module] || "📦"}</span>
                {module.toUpperCase()}
              </h3>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permiso</TableHead>
                      <TableHead>Acción</TableHead>
                      {roles.map((role) => (
                        <TableHead key={role} className="text-center">
                          {role}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((perm: any) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{perm.description}</div>
                            {perm.resource && (
                              <div className="text-xs text-muted-foreground">
                                Recurso: {perm.resource}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${actionColors[perm.action] || ""} text-white`}
                          >
                            {perm.action}
                          </Badge>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={role} className="text-center">
                            {roleHasPermission(role, perm.id) ? (
                              <Shield className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
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
