import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertCircle, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { api, ApiError } from "@/lib/api";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  room_number?: string | null;
  assigned_to_name?: string | null;
}

interface RoomItem {
  id: number;
  number: string;
}

interface StaffItem {
  user_id: number;
  profiles?: {
    full_name?: string;
  };
}

const taskTypes = [
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "CLEANING", label: "Limpieza" },
  { value: "INSPECTION", label: "Inspección" },
  { value: "REPAIR", label: "Reparación" },
  { value: "DELIVERY", label: "Entrega" },
  { value: "OTHER", label: "Otro" },
];

const initialFormData = {
  title: "",
  description: "",
  type: "MAINTENANCE",
  priority: "MEDIUM",
  due_date: "",
  room_id: "",
  assigned_to: "",
};

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [statusTaskId, setStatusTaskId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks({ per_page: "100" }),
  });

  const { data: roomsResponse } = useQuery({
    queryKey: ["rooms", "tasks"],
    queryFn: () => api.getRooms(),
    staleTime: 60_000,
  });

  const { data: staffResponse } = useQuery({
    queryKey: ["staff", "tasks"],
    queryFn: () => api.getStaff(),
    staleTime: 60_000,
  });

  const tasks = (tasksResponse?.data ?? []) as TaskItem[];
  const rooms = (roomsResponse?.data ?? []) as RoomItem[];
  const staff = (staffResponse?.data ?? []) as StaffItem[];

  const createTaskMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.createTask(payload),
    onSuccess: () => {
      toast.success("Tarea creada correctamente");
      setDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "No se pudo crear la tarea");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      api.updateTask(taskId, { status }),
    onSuccess: (_res, variables) => {
      const statusLabel =
        variables.status === "IN_PROGRESS"
          ? "en progreso"
          : variables.status === "COMPLETED"
            ? "completada"
            : "actualizada";
      toast.success(`Tarea ${statusLabel}`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "No se pudo actualizar la tarea");
    },
    onSettled: () => {
      setStatusTaskId(null);
    },
  });

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  }), [tasks]);

  const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
    LOW: { label: "Baja", color: "bg-blue-100 text-blue-700", icon: Clock },
    MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
    URGENT: { label: "Urgente", color: "bg-red-100 text-red-700", icon: AlertCircle },
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Pendiente", color: "secondary", icon: Clock },
    IN_PROGRESS: { label: "En Progreso", color: "default", icon: AlertCircle },
    COMPLETED: { label: "Completada", color: "outline", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelada", color: "destructive", icon: XCircle },
  };

  const handleCreateTask = () => {
    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    createTaskMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      priority: formData.priority,
      due_date: formData.due_date || null,
      room_id: formData.room_id ? Number(formData.room_id) : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    });
  };

  const moveTaskForward = (task: TaskItem) => {
    if (task.status === "PENDING") {
      setStatusTaskId(task.id);
      updateTaskMutation.mutate({ taskId: task.id, status: "IN_PROGRESS" });
      return;
    }

    if (task.status === "IN_PROGRESS") {
      setStatusTaskId(task.id);
      updateTaskMutation.mutate({ taskId: task.id, status: "COMPLETED" });
    }
  };

  const renderTaskCard = (task: TaskItem) => {
    const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    const statusInfo = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.PENDING;
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={task.id} className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{task.title}</h4>
                  <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                  <Badge variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}>
                    {statusInfo.label}
                  </Badge>
                </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}
              <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                {task.room_number && <span>Habitación {task.room_number}</span>}
                {task.assigned_to_name && <span>Asignado a {task.assigned_to_name}</span>}
                {task.due_date && <span>Vence {task.due_date}</span>}
              </div>
            </div>
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => moveTaskForward(task)}
                disabled={updateTaskMutation.isPending && statusTaskId === task.id}
              >
                {task.status === "PENDING" ? "Iniciar" : "Completar"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedTaskId(task.id);
                setDetailsDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
            </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tareas & Mantenimiento</h1>
          <p className="text-muted-foreground">
            Gestión de tareas operativas y órdenes de trabajo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>Crear una nueva tarea u orden de trabajo</DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  placeholder="Ej: Reparar grifo habitación 101"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Detalles de la tarea..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baja</SelectItem>
                      <SelectItem value="MEDIUM">Media</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Habitación (opcional)</Label>
                  <Select
                    value={formData.room_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, room_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin habitación</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Asignar a (opcional)</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assigned_to: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {staff.map((member) => (
                        <SelectItem key={member.user_id} value={String(member.user_id)}>
                          {member.profiles?.full_name || `Usuario ${member.user_id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Fecha límite (opcional)</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                className="w-full"
              >
                {createTaskMutation.isPending ? "Creando..." : "Crear Tarea"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-amber-500">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-500">{stats.inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-emerald-500">{stats.completed}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">En Progreso ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({stats.completed})</TabsTrigger>
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {tasks.filter((t) => t.status === "PENDING").map(renderTaskCard)}
          {tasks.filter((t) => t.status === "PENDING").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas pendientes
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {tasks.filter((t) => t.status === "IN_PROGRESS").map(renderTaskCard)}
          {tasks.filter((t) => t.status === "IN_PROGRESS").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tasks.filter((t) => t.status === "COMPLETED").map(renderTaskCard)}
          {tasks.filter((t) => t.status === "COMPLETED").length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas completadas
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {tasks.map(renderTaskCard)}
          {tasks.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas registradas
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <TaskDetailsDialog
        taskId={selectedTaskId}
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
