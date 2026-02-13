import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, Plus, User, History } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Incident {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  category: string;
  created_at: string;
  resolved_at?: string;
  room_id?: string;
  assigned_to?: string;
  rooms?: { room_number: string };
  assigned_user?: { full_name: string };
  reporter?: { full_name: string };
}

const priorityConfig = {
  LOW: { label: "Baja", variant: "secondary" as const },
  MEDIUM: { label: "Media", variant: "default" as const },
  HIGH: { label: "Alta", variant: "destructive" as const },
  URGENT: { label: "Urgente", variant: "destructive" as const },
};

const statusConfig = {
  OPEN: { label: "Abierta", icon: AlertCircle, color: "text-destructive" },
  IN_PROGRESS: { label: "En progreso", icon: Clock, color: "text-warning" },
  RESOLVED: { label: "Resuelta", icon: CheckCircle2, color: "text-success" },
};

export default function IncidentReports() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterView, setFilterView] = useState<"all" | "mine" | "unassigned">("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "MAINTENANCE",
    room_id: "",
    assigned_to: "",
  });

  // Obtener usuarios del hotel para asignación
  const { data: hotelUsers } = useQuery({
    queryKey: ["hotel-users"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data: userRolesList, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("hotel_id", userRoles.hotel_id);

      if (rolesError) throw rolesError;

      const userIds = userRolesList?.map(ur => ur.user_id) || [];

      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (error) throw error;
      return data?.map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name || profile.id
      })) || [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-incidents"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number")
        .eq("hotel_id", userRoles.hotel_id)
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data: incidentsData, error } = await supabase
        .from("incidents")
        .select("*, rooms(room_number)")
        .eq("hotel_id", userRoles.hotel_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs for assigned_to and reported_by
      const userIds = new Set<string>();
      incidentsData?.forEach((inc: any) => {
        if (inc.assigned_to) userIds.add(inc.assigned_to);
        if (inc.reported_by) userIds.add(inc.reported_by);
      });

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Map incidents with user data
      return incidentsData?.map((inc: any) => ({
        ...inc,
        assigned_user: inc.assigned_to ? profilesMap.get(inc.assigned_to) : null,
        reporter: inc.reported_by ? profilesMap.get(inc.reported_by) : null,
      })) as Incident[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not found");

      const { error } = await supabase.from("incidents").insert({
        ...data,
        hotel_id: userRoles.hotel_id,
        reported_by: user.id,
        room_id: data.room_id || null,
        assigned_to: data.assigned_to || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "MAINTENANCE",
        room_id: "",
        assigned_to: "",
      });
      toast({ title: "Incidencia reportada correctamente" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string | null }) => {
      const { error } = await supabase
        .from("incidents")
        .update({ assigned_to })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Incidencia asignada correctamente" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "RESOLVED") {
        update.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("incidents")
        .update(update)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Obtener ID del usuario actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);
  
  const filteredIncidents = incidents?.filter((i) => {
    if (filterView === "mine") {
      return i.assigned_to === currentUserId;
    }
    if (filterView === "unassigned") {
      return !i.assigned_to;
    }
    return true;
  }) || [];

  const openIncidents = filteredIncidents?.filter((i) => i.status !== "RESOLVED") || [];
  const urgentIncidents = openIncidents.filter((i) => i.priority === "URGENT" || i.priority === "HIGH");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Reporte de Incidencias
            {urgentIncidents.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {urgentIncidents.length} urgentes
              </Badge>
            )}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Incidencia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar Incidencia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Breve descripción del problema"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles de la incidencia..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="MEDIUM">Media</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                        <SelectItem value="CLEANING">Limpieza</SelectItem>
                        <SelectItem value="SUPPLIES">Suministros</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Habitación (opcional)</Label>
                  <Select
                    value={formData.room_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, room_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar habitación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Habitación {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Asignar a (opcional)</Label>
                  <Select
                    value={formData.assigned_to || "none"}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {hotelUsers?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.title || !formData.description}
                  className="w-full"
                >
                  Reportar Incidencia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filtros de vista */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filterView === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterView("all")}
          >
            Todas ({incidents?.length || 0})
          </Button>
          <Button
            variant={filterView === "mine" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterView("mine")}
          >
            Mis incidencias
          </Button>
          <Button
            variant={filterView === "unassigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterView("unassigned")}
          >
            Sin asignar ({incidents?.filter(i => !i.assigned_to).length || 0})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : filteredIncidents?.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <p className="font-medium">¡Sin incidencias!</p>
              <p className="text-sm text-muted-foreground mb-4">
                No hay incidencias reportadas. Puedes reportar una nueva si encuentras algún problema.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents?.map((incident) => {
              const StatusIcon = statusConfig[incident.status].icon;
              return (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{incident.title}</h4>
                        <Badge variant={priorityConfig[incident.priority].variant}>
                          {priorityConfig[incident.priority].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{incident.category}</span>
                        {incident.rooms && <span>• Hab. {incident.rooms.room_number}</span>}
                        <span>• {new Date(incident.created_at).toLocaleDateString()}</span>
                        {incident.reporter && (
                          <span>• Reportó: {incident.reporter.full_name}</span>
                        )}
                      </div>
                      {incident.assigned_to && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">
                            Asignado: {incident.assigned_user?.full_name || "Usuario"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1 ${statusConfig[incident.status].color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm">{statusConfig[incident.status].label}</span>
                      </div>

                      {/* Asignación */}
                      {!incident.assigned_to && incident.status !== "RESOLVED" && (
                        <Select
                          value="unassigned"
                          onValueChange={(value) =>
                            assignMutation.mutate({ id: incident.id, assigned_to: value === "unassigned" ? null : value })
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Asignar a..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {hotelUsers?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Cambio de estado */}
                      {incident.status !== "RESOLVED" && (
                        <Select
                          value={incident.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: incident.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Abierta</SelectItem>
                            <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                            <SelectItem value="RESOLVED">Resuelta</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
