import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Mail, Phone, Shield, Calendar, Clock, Plus, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function Staff() {
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  // Get hotel_id
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch staff members
  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-list", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("hotel_id", userRoles.hotel_id);

      if (error) throw error;

      // Fetch profiles separately to avoid PostgREST join issues
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((s: any) => s.user_id))];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email")
          .in("id", userIds);

        return data.map((member: any) => {
          const profile = profiles?.find((p) => p.id === member.user_id);
          return {
            ...member,
            profiles: profile,
            email: profile?.email,
          };
        });
      }

      return data;
    },
  });

  // Fetch pending invitations
  const { data: invitations } = useQuery({
    queryKey: ["staff-invitations", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const roleConfig = {
    HOTEL_OWNER: {
      label: "Propietario",
      color: "bg-purple-100 text-purple-700",
      icon: Shield,
    },
    MANAGER: {
      label: "Manager",
      color: "bg-blue-100 text-blue-700",
      icon: UserCog,
    },
    RECEPTION: {
      label: "Recepción",
      color: "bg-green-100 text-green-700",
      icon: UserCog,
    },
    HOUSEKEEPING: {
      label: "Limpieza",
      color: "bg-yellow-100 text-yellow-700",
      icon: UserCog,
    },
    MAINTENANCE: {
      label: "Mantenimiento",
      color: "bg-orange-100 text-orange-700",
      icon: UserCog,
    },
    STAFF: {
      label: "Personal",
      color: "bg-gray-100 text-gray-700",
      icon: UserCog,
    },
  };

  // Calculate statistics by role
  const statsByRole = staff?.reduce((acc: any, member: any) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {});

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Staff & RRHH</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff & RRHH</h1>
          <p className="text-muted-foreground">
            Gestión de personal y recursos humanos
          </p>
        </div>
        {userRoles?.hotel_id && (
          <PermissionGuard module="staff" action="create" hotelId={userRoles.hotel_id}>
            <Button 
              onClick={() => setAddStaffDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Personal
            </Button>
          </PermissionGuard>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const count = statsByRole?.[role] || 0;
          return (
            <Card key={role}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.filter(i => i.status === 'PENDING').length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-orange-600" />
              Invitaciones Pendientes ({invitations.filter(i => i.status === 'PENDING').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.filter(i => i.status === 'PENDING').map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                        {invite.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{invite.full_name}</p>
                      <p className="text-xs text-muted-foreground">{invite.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {roleConfig[invite.role as keyof typeof roleConfig]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Pendiente
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List by Role */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({staff?.length || 0})</TabsTrigger>
          <TabsTrigger value="management">Gestión</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal del Hotel</CardTitle>
              <CardDescription>
                Lista completa del equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff?.map((member: any) => {
                  const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                  const RoleIcon = roleInfo?.icon || UserCog;

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(member.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">
                            {member.profiles?.full_name || "Sin nombre"}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {member.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </div>
                            )}
                            {member.profiles?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.profiles.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(member.created_at), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </div>
                        <Badge className={roleInfo?.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo?.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipo de Gestión</CardTitle>
              <CardDescription>
                Propietarios y managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff
                  ?.filter((m: any) => ["HOTEL_OWNER", "MANAGER"].includes(m.role))
                  .map((member: any) => {
                    const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(member.profiles?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{member.profiles?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <Badge className={roleInfo?.color}>{roleInfo?.label}</Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipo Operativo</CardTitle>
              <CardDescription>
                Recepción, limpieza y mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff
                  ?.filter((m: any) => ["RECEPTION", "HOUSEKEEPING", "MAINTENANCE", "STAFF"].includes(m.role))
                  .map((member: any) => {
                    const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(member.profiles?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{member.profiles?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <Badge className={roleInfo?.color}>{roleInfo?.label}</Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Future Features Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Turnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Próximamente: Gestión de turnos y horarios
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Próximamente: Control de asistencia
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Próximamente: Evaluaciones de desempeño
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Staff Dialog */}
      {userRoles?.hotel_id && (
        <AddStaffDialog 
          open={addStaffDialogOpen}
          onClose={() => setAddStaffDialogOpen(false)}
          hotelId={userRoles.hotel_id}
        />
      )}
    </div>
  );
}
