import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Phone, Shield, Eye } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

type AppRole = "SUPER_ADMIN" | "HOTEL_OWNER" | "MANAGER" | "SALES" | "RECEPTION" | "HOUSEKEEPING";

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrador",
  HOTEL_OWNER: "Propietario",
  MANAGER: "Supervisor/Gerente",
  SALES: "Ventas",
  RECEPTION: "Recepcionista",
  HOUSEKEEPING: "Housekeeping",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500",
  HOTEL_OWNER: "bg-blue-500",
  MANAGER: "bg-green-500",
  SALES: "bg-orange-500",
  RECEPTION: "bg-cyan-500",
  HOUSEKEEPING: "bg-yellow-500",
};

interface UserManagementProps {
  hotelId: string;
}

export default function UserManagement({ hotelId }: UserManagementProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  // Use current user from API as the only visible user for now
  const { data: me, isLoading } = useQuery({
    queryKey: ["me-for-users"],
    queryFn: async () => {
      const res = await api.me();
      return res.data;
    },
  });

  const users: UserWithRole[] = me ? [{
    id: String(me.user?.id || "1"),
    user_id: String(me.user?.id || "1"),
    role: me.role || "HOTEL_OWNER",
    full_name: me.user?.name || null,
    phone: me.user?.phone || null,
    email: me.user?.email || null,
    created_at: me.user?.created_at || new Date().toISOString(),
  }] : [];

  const handleViewDetails = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Usuarios y Roles
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Administra los usuarios del hotel y asigna roles con permisos específicos
          </p>
        </div>
        <Button onClick={() => toast.info("Gestión de usuarios próximamente disponible")}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.full_name || "Sin nombre"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {user.email && <div>{user.email}</div>}
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${ROLE_COLORS[user.role] || "bg-gray-500"} text-white`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(user)}
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay usuarios registrados en este hotel</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre Completo</Label>
                <p className="font-medium">{selectedUser.full_name || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedUser.email || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{selectedUser.phone || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Rol</Label>
                <Badge className={`${ROLE_COLORS[selectedUser.role] || "bg-gray-500"} text-white mt-1`}>
                  {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Fecha de Creación</Label>
                <p className="font-medium">
                  {new Date(selectedUser.created_at).toLocaleDateString('es-DO', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
