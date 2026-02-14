import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Mail, Phone, Shield, Calendar, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";

export default function Staff() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.me();
      return res.data;
    },
  });

  const { data: staffRes, isLoading: staffLoading, refetch } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => api.getStaff(),
    enabled: !!me,
  });

  const staff = (staffRes?.data || []) as any[];
  const isLoading = !me || staffLoading;

  const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
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
    SALES: {
      label: "Ventas",
      color: "bg-gray-100 text-gray-700",
      icon: UserCog,
    },
  };

  const statsByRole = staff.reduce((acc: any, member: any) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff & RRHH</h1>
          <p className="text-muted-foreground">
            Gestión de personal y recursos humanos
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Personal
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({staff.length})</TabsTrigger>
          <TabsTrigger value="management">Gestión</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal del Hotel</CardTitle>
              <CardDescription>Lista completa del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((member: any) => {
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
                          {roleInfo?.label || member.role}
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
              <CardDescription>Propietarios y managers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff
                  .filter((m: any) => ["HOTEL_OWNER", "MANAGER"].includes(m.role))
                  .map((member: any) => {
                    const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                    return (
                      <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
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
              <CardDescription>Recepción, limpieza y ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff
                  .filter((m: any) => ["RECEPTION", "HOUSEKEEPING", "SALES"].includes(m.role))
                  .length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay personal operativo registrado
                  </p>
                ) : (
                  staff
                    .filter((m: any) => ["RECEPTION", "HOUSEKEEPING", "SALES"].includes(m.role))
                    .map((member: any) => {
                      const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                      return (
                        <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      <AddStaffDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onInvited={() => refetch()}
      />
    </div>
  );
}
