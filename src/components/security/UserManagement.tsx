import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Mail, Phone, Shield, Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

type AppRole = "SUPER_ADMIN" | "HOTEL_OWNER" | "MANAGER" | "SALES" | "RECEPTION" | "HOUSEKEEPING";

interface UserWithRole {
  id: string;
  user_id: string;
  hotel_id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: AppRole;
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
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editUser, setEditUser] = useState<Partial<UserWithRole>>({});
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "RECEPTION",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["hotel-users", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles_with_profiles")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-users", hotelId] });
      toast.success("Rol actualizado correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar rol: " + error.message);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      // Aquí deberías llamar a un edge function para crear el usuario
      // Por ahora solo mostramos un mensaje
      toast.info("Función de creación de usuarios pendiente de implementar con Edge Function");
      throw new Error("Pendiente de implementar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-users", hotelId] });
      setIsDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "RECEPTION",
      });
      toast.success("Usuario creado correctamente");
    },
    onError: (error) => {
      toast.error("Error al crear usuario: " + error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserWithRole> & { id: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
        })
        .eq("id", userData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-users", hotelId] });
      setIsEditDialogOpen(false);
      toast.success("Usuario actualizado correctamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar usuario: " + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-users", hotelId] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success("Usuario eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar usuario: " + error.message);
    },
  });

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const handleViewDetails = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser.id) {
      updateUserMutation.mutate(editUser as Partial<UserWithRole> & { id: string });
    }
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Complete los datos del nuevo usuario del hotel
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña Temporal</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: AppRole) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Crear Usuario
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead>Cambiar Rol</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.full_name || "Sin nombre"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${ROLE_COLORS[user.role]} text-white`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: AppRole) => handleRoleChange(user.id, newRole)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(user)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      title="Editar usuario"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      title="Eliminar usuario"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay usuarios registrados en este hotel</p>
          </div>
        )}
      </CardContent>

      {/* Dialog de Detalles */}
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
                <Label className="text-sm text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{selectedUser.phone || "No especificado"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Rol</Label>
                <Badge className={`${ROLE_COLORS[selectedUser.role]} text-white mt-1`}>
                  {ROLE_LABELS[selectedUser.role]}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Usuario ID</Label>
                <p className="font-mono text-xs">{selectedUser.user_id}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Fecha de Creación</Label>
                <p className="font-medium">
                  {new Date(selectedUser.created_at).toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Nombre Completo</Label>
              <Input
                id="edit_full_name"
                value={editUser.full_name || ""}
                onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Teléfono</Label>
              <Input
                id="edit_phone"
                value={editUser.phone || ""}
                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Rol</Label>
              <Select
                value={editUser.role}
                onValueChange={(value: AppRole) => setEditUser({ ...editUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <span className="font-semibold">{selectedUser?.full_name}</span> y su acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
