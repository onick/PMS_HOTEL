import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Incident {
  id: number;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  category: string;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
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

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as {
    message?: string;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };

  const validationMessage = maybeError.data?.errors
    ? Object.values(maybeError.data.errors).flat().find(Boolean)
    : null;

  return (
    validationMessage ||
    maybeError.data?.message ||
    maybeError.message ||
    fallback
  );
};

export default function IncidentReports() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [incidentToResolve, setIncidentToResolve] = useState<Incident | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Incident["priority"],
    category: "MAINTENANCE",
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["housekeeping-incidents"],
    queryFn: async () => {
      const res = await api.getIncidents();
      return (res.data || []) as Incident[];
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: () =>
      api.createIncident({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
      }),
    onMutate: () => {
      toast.loading("Enviando incidencia...", {
        id: "incident-create",
        description: "Estamos registrando el reporte.",
      });
    },
    onSuccess: () => {
      toast.success("Incidencia reportada", {
        id: "incident-create",
        description: "El equipo ya puede gestionarla.",
        duration: 3500,
      });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "MAINTENANCE",
      });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-incidents"] });
    },
    onError: (error: unknown) => {
      toast.error("No se pudo reportar la incidencia", {
        id: "incident-create",
        description: getApiErrorMessage(error, "Intenta nuevamente en unos segundos."),
        duration: 5000,
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      incidentId,
      status,
      comment,
    }: {
      incidentId: number;
      status: Incident["status"];
      comment?: string;
    }) => api.updateIncidentStatus(incidentId, { status, comment }),
    onMutate: ({ status }) => {
      const nextLabel = statusConfig[status].label.toLowerCase();
      toast.loading("Actualizando incidencia...", {
        id: "incident-status-update",
        description: `Cambiando estado a ${nextLabel}.`,
      });
    },
    onSuccess: (_data, variables) => {
      const nextLabel = statusConfig[variables.status].label.toLowerCase();
      toast.success("Estado actualizado", {
        id: "incident-status-update",
        description:
          variables.status === "RESOLVED"
            ? "La incidencia quedó resuelta correctamente."
            : `La incidencia quedó en ${nextLabel}.`,
        duration: 3500,
      });
      queryClient.invalidateQueries({ queryKey: ["housekeeping-incidents"] });
    },
    onError: (error: unknown) => {
      toast.error("No se pudo actualizar el estado", {
        id: "incident-status-update",
        description: getApiErrorMessage(error, "Verifica permisos o conexión e intenta de nuevo."),
        duration: 5000,
      });
    },
  });

  const activeIncidents = incidents.filter((incident) => incident.status !== "RESOLVED");
  const resolvedIncidents = incidents.filter((incident) => incident.status === "RESOLVED");

  const renderIncidentCard = (incident: Incident) => {
    const StatusIcon = statusConfig[incident.status].icon;

    return (
      <div
        key={incident.id}
        className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{incident.title}</h4>
              <Badge variant={priorityConfig[incident.priority].variant}>
                {priorityConfig[incident.priority].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {incident.description}
            </p>
            {incident.status === "RESOLVED" && incident.resolution_notes && (
              <div className="mt-2 rounded-md border bg-muted/40 p-2">
                <p className="text-xs font-medium">Comentario de resolución</p>
                <p className="text-sm text-muted-foreground">{incident.resolution_notes}</p>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 shrink-0 ${statusConfig[incident.status].color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm">{statusConfig[incident.status].label}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {incident.status === "OPEN" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateStatusMutation.mutate({ incidentId: incident.id, status: "IN_PROGRESS" })
              }
              disabled={updateStatusMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          )}
          {incident.status === "IN_PROGRESS" && (
            <Button
              size="sm"
              onClick={() => {
                setIncidentToResolve(incident);
                setResolutionComment("");
                setResolveDialogOpen(true);
              }}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar resuelta
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Reporte de Incidencias
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
                    placeholder="Breve descripción del problema"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Detalles de la incidencia..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value as Incident["priority"] })
                      }
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
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                        <SelectItem value="CLEANING">Limpieza</SelectItem>
                        <SelectItem value="SUPPLIES">Suministros</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => createIncidentMutation.mutate()}
                  disabled={!formData.title || createIncidentMutation.isPending}
                  className="w-full"
                >
                  Reportar Incidencia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : incidents.length === 0 ? (
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
          <div className="space-y-0">
            <div className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-3 bg-card border-y">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Activas: {activeIncidents.length}</span>
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => setShowResolved((prev) => !prev)}
                >
                  {showResolved ? "Ocultar resueltas" : `Mostrar resueltas (${resolvedIncidents.length})`}
                </button>
              </div>
            </div>
            <ScrollArea className="max-h-[60vh] md:max-h-[520px] pr-3">
              <div className="space-y-3">
                {activeIncidents.map(renderIncidentCard)}
                {showResolved && resolvedIncidents.map(renderIncidentCard)}
              </div>
            </ScrollArea>
          </div>
        )}

        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver incidencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {incidentToResolve?.title || "Incidencia"}
              </p>
              <div>
                <Label htmlFor="resolution-comment">Comentario de resolución (opcional)</Label>
                <Textarea
                  id="resolution-comment"
                  placeholder="Qué se hizo para resolver la incidencia..."
                  rows={4}
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!incidentToResolve) return;
                  updateStatusMutation.mutate(
                    {
                      incidentId: incidentToResolve.id,
                      status: "RESOLVED",
                      comment: resolutionComment.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        setResolveDialogOpen(false);
                        setIncidentToResolve(null);
                        setResolutionComment("");
                      },
                    }
                  );
                }}
                disabled={updateStatusMutation.isPending}
              >
                Confirmar resolución
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
