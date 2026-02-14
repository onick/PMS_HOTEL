import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Plus, AlertCircle, Clock, CheckCircle2, XCircle, Calendar, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // TODO: Wire up when backend tasks endpoints are available
  const tasks: any[] = [];
  const isLoading = false;

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

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
                <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
            </div>
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setSelectedTask(task); setDetailsDialogOpen(true); }}
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
            <Button className="bg-purple-500 hover:bg-purple-600">
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
                <Input placeholder="Ej: Reparar grifo habitación 101" />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea placeholder="Detalles de la tarea..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select defaultValue="MAINTENANCE">
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
                  <Select defaultValue="MEDIUM">
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
              <div>
                <Label>Fecha límite (opcional)</Label>
                <Input type="date" />
              </div>
              <Button
                onClick={() => {
                  toast.info("Módulo de tareas próximamente disponible");
                  setDialogOpen(false);
                }}
                className="w-full"
              >
                Crear Tarea
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
        task={selectedTask}
        open={detailsDialogOpen}
        onClose={() => { setDetailsDialogOpen(false); setSelectedTask(null); }}
      />
    </div>
  );
}
