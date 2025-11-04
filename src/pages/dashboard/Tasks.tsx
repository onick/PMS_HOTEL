import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Plus, AlertCircle, Clock, CheckCircle2, XCircle, Calendar, MessageSquare, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";

export default function Tasks() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    task_type: "MAINTENANCE",
    room_id: "none",
    due_date: "",
    assigned_to: "none",
  });

  // Get hotel_id and user
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id, user_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      if (data && data.length > 0) {
        const roomIds = [...new Set(data.map(t => t.room_id).filter(Boolean))];
        const userIds = [...new Set([
          ...data.map(t => t.assigned_to).filter(Boolean),
          ...data.map(t => t.created_by).filter(Boolean)
        ])];

        // Fetch rooms
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, room_number")
          .in("id", roomIds);

        // Fetch profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        // Map data
        return data.map((task: any) => ({
          ...task,
          rooms: rooms?.find(r => r.id === task.room_id),
          assigned_to_user: task.assigned_to ? {
            user_id: task.assigned_to,
            profiles: profiles?.find(p => p.id === task.assigned_to)
          } : null,
          created_by_user: {
            user_id: task.created_by,
            profiles: profiles?.find(p => p.id === task.created_by)
          }
        }));
      }

      return data;
    },
  });

  // Fetch rooms for dropdown
  const { data: rooms } = useQuery({
    queryKey: ["rooms", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number")
        .eq("hotel_id", userRoles.hotel_id)
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  // Fetch staff for assignment
  const { data: staff } = useQuery({
    queryKey: ["staff", userRoles?.hotel_id],
    enabled: !!userRoles?.hotel_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("hotel_id", userRoles.hotel_id);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(ur => ur.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        return data.map(ur => ({
          user_id: ur.user_id,
          profiles: profiles?.find(p => p.id === ur.user_id)
        }));
      }

      return data;
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: typeof newTask & { assigned_to?: string }) => {
      if (!userRoles?.hotel_id) throw new Error("No hotel ID");

      const { error } = await supabase
        .from("tasks")
        .insert({
          hotel_id: userRoles.hotel_id,
          created_by: userRoles.user_id,
          status: "PENDING",
          ...task,
          room_id: task.room_id === "none" ? null : task.room_id,
          assigned_to: task.assigned_to === "none" ? null : task.assigned_to,
          due_date: task.due_date || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea creada correctamente");
      setDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "MEDIUM",
        task_type: "MAINTENANCE",
        room_id: "none",
        due_date: "",
        assigned_to: "none",
      });
    },
    onError: () => {
      toast.error("Error al crear tarea");
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status,
          completed_at: status === "COMPLETED" ? new Date().toISOString() : null
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });

  // Reopen completed task
  const reopenTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "PENDING",
          completed_at: null
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea reabierta correctamente");
    },
    onError: () => {
      toast.error("Error al reabrir tarea");
    },
  });

  // Duplicate task
  const duplicateTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("tasks")
        .insert({
          hotel_id: task.hotel_id,
          title: task.title,
          description: task.description,
          task_type: task.task_type,
          priority: task.priority,
          status: "PENDING",
          room_id: task.room_id,
          assigned_to: task.assigned_to,
          created_by: user.id,
          due_date: task.due_date,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea similar creada correctamente");
    },
    onError: () => {
      toast.error("Error al crear tarea");
    },
  });

  // Calculate statistics
  const stats = {
    total: tasks?.length || 0,
    pending: tasks?.filter((t) => t.status === "PENDING").length || 0,
    inProgress: tasks?.filter((t) => t.status === "IN_PROGRESS").length || 0,
    completed: tasks?.filter((t) => t.status === "COMPLETED").length || 0,
  };

  const priorityConfig = {
    LOW: { label: "Baja", color: "bg-blue-100 text-blue-700", icon: Clock },
    MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700", icon: AlertCircle },
  };

  const statusConfig = {
    PENDING: { label: "Pendiente", color: "secondary", icon: Clock },
    IN_PROGRESS: { label: "En Progreso", color: "default", icon: AlertCircle },
    COMPLETED: { label: "Completada", color: "outline", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelada", color: "destructive", icon: XCircle },
  };

  const taskTypes = [
    { value: "MAINTENANCE", label: "Mantenimiento" },
    { value: "CLEANING", label: "Limpieza" },
    { value: "INSPECTION", label: "Inspección" },
    { value: "REPAIR", label: "Reparación" },
    { value: "DELIVERY", label: "Entrega" },
    { value: "OTHER", label: "Otro" },
  ];

  const renderTaskCard = (task: any) => {
    const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig];
    const statusInfo = statusConfig[task.status as keyof typeof statusConfig];
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={task.id} className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{task.title}</h4>
                <Badge className={priorityInfo.color}>
                  {priorityInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {task.description}
              </p>
              {task.rooms && (
                <Badge variant="outline" className="text-xs">
                  Habitación {task.rooms.room_number}
                </Badge>
              )}
            </div>
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {task.assigned_to_user?.profiles?.full_name ? (
                <span>Asignado a: {task.assigned_to_user.profiles.full_name}</span>
              ) : (
                <span>Sin asignar</span>
              )}
            </div>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: es })}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedTask(task);
                setDetailsDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
            </Button>
            {task.status === "PENDING" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: "IN_PROGRESS" })}
              >
                Iniciar
              </Button>
            )}
            {task.status === "IN_PROGRESS" && (
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: "COMPLETED" })}
              >
                Completar
              </Button>
            )}
            {task.status === "COMPLETED" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reopenTaskMutation.mutate(task.id)}
                  disabled={reopenTaskMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reabrir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateTaskMutation.mutate(task)}
                  disabled={duplicateTaskMutation.isPending}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Crear Similar
                </Button>
              </>
            )}
            {task.status !== "CANCELLED" && task.status !== "COMPLETED" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: "CANCELLED" })}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tareas & Mantenimiento</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tareas & Mantenimiento</h1>
          <p className="text-muted-foreground">
            Gestión de tareas operativas y órdenes de trabajo
          </p>
        </div>
        {userRoles?.hotel_id && (
          <PermissionGuard module="tasks" action="create" hotelId={userRoles.hotel_id}>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Tarea</DialogTitle>
                  <DialogDescription>
                    Crear una nueva tarea u orden de trabajo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Ej: Reparar grifo habitación 101"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Detalles de la tarea..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={newTask.task_type}
                        onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prioridad</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
                  </div>
                  <div>
                    <Label>Habitación (opcional)</Label>
                    <Select
                      value={newTask.room_id}
                      onValueChange={(value) => setNewTask({ ...newTask, room_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar habitación..." />
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
                      value={newTask.assigned_to}
                      onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {staff?.map((member: any) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.full_name || "Sin nombre"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha límite (opcional)</Label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={() => createTaskMutation.mutate(newTask)}
                    disabled={!newTask.title || createTaskMutation.isPending}
                    className="w-full"
                  >
                    Crear Tarea
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Status */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">En Progreso ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({stats.completed})</TabsTrigger>
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {tasks?.filter((t) => t.status === "PENDING").map(renderTaskCard)}
          {tasks?.filter((t) => t.status === "PENDING").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas pendientes
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {tasks?.filter((t) => t.status === "IN_PROGRESS").map(renderTaskCard)}
          {tasks?.filter((t) => t.status === "IN_PROGRESS").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tasks?.filter((t) => t.status === "COMPLETED").map(renderTaskCard)}
          {tasks?.filter((t) => t.status === "COMPLETED").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas completadas
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {tasks?.map(renderTaskCard)}
          {tasks?.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas registradas
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
