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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle2, Clock, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  sla_target_minutes?: number | null;
  sla_deadline_at?: string | null;
  sla_breached?: boolean;
  escalation_required?: boolean;
}

type QuickFilter = "ALL" | "CRITICAL" | "TODAY" | "UNASSIGNED";

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

const quickFilters: Array<{ value: QuickFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "CRITICAL", label: "Críticas" },
  { value: "TODAY", label: "Hoy" },
  { value: "UNASSIGNED", label: "Sin asignar" },
];

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

const isToday = (dateString: string): boolean => {
  const target = new Date(dateString);
  const now = new Date();

  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
};

const isWithinLastDays = (dateString: string, days: number): boolean => {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;

  return now - target <= windowMs;
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const fallbackSlaMinutesByPriority: Partial<Record<Incident["priority"], number>> = {
  URGENT: 15,
  HIGH: 30,
};

const getIncidentSlaState = (incident: Incident, nowTs: number) => {
  if (incident.status === "RESOLVED") {
    return null;
  }

  const targetMinutes = incident.sla_target_minutes ?? fallbackSlaMinutesByPriority[incident.priority] ?? null;
  if (!targetMinutes) {
    return null;
  }

  const deadlineMs = incident.sla_deadline_at
    ? new Date(incident.sla_deadline_at).getTime()
    : new Date(incident.created_at).getTime() + targetMinutes * 60_000;

  if (Number.isNaN(deadlineMs)) {
    return null;
  }

  const remainingMinutes = Math.ceil((deadlineMs - nowTs) / 60_000);
  const breached = typeof incident.sla_breached === "boolean" ? incident.sla_breached : remainingMinutes < 0;

  return {
    targetMinutes,
    remainingMinutes,
    breached,
  };
};

export default function IncidentReports() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [incidentToResolve, setIncidentToResolve] = useState<Incident | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL");
  const [resolvedSearch, setResolvedSearch] = useState("");
  const [nowTs, setNowTs] = useState(Date.now());
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
  const openIncidents = activeIncidents.filter((incident) => incident.status === "OPEN");
  const inProgressIncidents = activeIncidents.filter((incident) => incident.status === "IN_PROGRESS");
  const resolvedIncidents = incidents.filter((incident) => incident.status === "RESOLVED");

  const criticalCount = activeIncidents.filter(
    (incident) => incident.priority === "HIGH" || incident.priority === "URGENT",
  ).length;

  const resolvedLast7dCount = resolvedIncidents.filter(
    (incident) => incident.resolved_at && isWithinLastDays(incident.resolved_at, 7),
  ).length;

  const urgentBreachedCount = activeIncidents.filter((incident) => {
    if (incident.priority !== "URGENT") return false;
    const sla = getIncidentSlaState(incident, nowTs);
    return !!sla?.breached;
  }).length;

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredActive = useMemo(() => {
    if (quickFilter === "ALL") return activeIncidents;

    if (quickFilter === "CRITICAL") {
      return activeIncidents.filter(
        (incident) => incident.priority === "HIGH" || incident.priority === "URGENT",
      );
    }

    if (quickFilter === "TODAY") {
      return activeIncidents.filter((incident) => isToday(incident.created_at));
    }

    return activeIncidents.filter((incident) => !incident.assigned_to && !incident.assigned_user?.full_name);
  }, [activeIncidents, quickFilter]);

  const filteredOpen = filteredActive.filter((incident) => incident.status === "OPEN");
  const filteredInProgress = filteredActive.filter((incident) => incident.status === "IN_PROGRESS");

  const normalizedResolvedSearch = resolvedSearch.trim().toLowerCase();
  const filteredResolved = normalizedResolvedSearch
    ? resolvedIncidents.filter((incident) => {
        const haystack = [
          incident.title,
          incident.description,
          incident.resolution_notes || "",
          incident.rooms?.room_number || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedResolvedSearch);
      })
    : resolvedIncidents;

  const renderIncidentCard = (incident: Incident) => {
    const StatusIcon = statusConfig[incident.status].icon;
    const slaState = getIncidentSlaState(incident, nowTs);
    const isEscalationRequired = incident.escalation_required || (incident.priority === "URGENT" && !!slaState?.breached);

    return (
      <div
        key={incident.id}
        className="p-3 rounded-lg border hover:border-primary/50 transition-colors"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-medium text-sm leading-5">{incident.title}</h4>
              <Badge variant={priorityConfig[incident.priority].variant}>
                {priorityConfig[incident.priority].label}
              </Badge>
              {slaState && (
                <Badge
                  variant={slaState.breached ? "destructive" : "outline"}
                  className={!slaState.breached ? "border-warning/40 text-warning" : undefined}
                >
                  {slaState.breached
                    ? `SLA vencido (${Math.abs(slaState.remainingMinutes)}m)`
                    : `SLA ${Math.max(0, slaState.remainingMinutes)}m`}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {incident.description}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {incident.rooms?.room_number && <span>Habitación {incident.rooms.room_number}</span>}
              <span>Creada: {formatDateTime(incident.created_at)}</span>
              {incident.reporter?.full_name && <span>Reportó: {incident.reporter.full_name}</span>}
            </div>

            {incident.status === "RESOLVED" && incident.resolution_notes && (
              <div className="mt-2 rounded-md border bg-muted/40 p-2">
                <p className="text-xs font-medium">Comentario de resolución</p>
                <p className="text-xs text-muted-foreground">{incident.resolution_notes}</p>
              </div>
            )}
            {isEscalationRequired && (
              <div className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 p-2">
                <p className="text-xs font-medium text-destructive">Escalación requerida</p>
                <p className="text-xs text-destructive/90">
                  Esta incidencia urgente superó el SLA sin ser iniciada.
                </p>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 shrink-0 ${statusConfig[incident.status].color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-xs">{statusConfig[incident.status].label}</span>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Abiertas</p>
                <p className="text-xl font-semibold text-destructive">{openIncidents.length}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">En progreso</p>
                <p className="text-xl font-semibold text-warning">{inProgressIncidents.length}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Críticas activas</p>
                <p className="text-xl font-semibold">{criticalCount}</p>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Resueltas 7d</p>
                <p className="text-xl font-semibold text-success">{resolvedLast7dCount}</p>
              </div>
            </div>

            {urgentBreachedCount > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
                <p className="text-sm font-medium text-destructive">
                  {urgentBreachedCount} incidencia(s) urgente(s) fuera de SLA
                </p>
                <p className="text-xs text-destructive/90">
                  Requieren atención inmediata y ya entraron en escalación.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={quickFilter === filter.value ? "default" : "outline"}
                  onClick={() => setQuickFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <ScrollArea className="max-h-[60vh] md:max-h-[520px] pr-3">
              <div className="space-y-4">
                <section className="space-y-2">
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur py-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Abiertas ({filteredOpen.length})
                    </p>
                  </div>
                  {filteredOpen.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      Sin incidencias abiertas para este filtro.
                    </div>
                  ) : (
                    filteredOpen.map(renderIncidentCard)
                  )}
                </section>

                <section className="space-y-2">
                  <div className="sticky top-0 z-10 bg-card/95 backdrop-blur py-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      En progreso ({filteredInProgress.length})
                    </p>
                  </div>
                  {filteredInProgress.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                      Sin incidencias en progreso para este filtro.
                    </div>
                  ) : (
                    filteredInProgress.map(renderIncidentCard)
                  )}
                </section>

                <Accordion type="single" collapsible className="rounded-lg border px-3">
                  <AccordionItem value="resolved" className="border-b-0">
                    <AccordionTrigger className="text-sm py-3">
                      Resueltas ({resolvedIncidents.length})
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-3">
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-8"
                            placeholder="Buscar en resueltas..."
                            value={resolvedSearch}
                            onChange={(e) => setResolvedSearch(e.target.value)}
                          />
                        </div>

                        {filteredResolved.length === 0 ? (
                          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                            No hay incidencias resueltas que coincidan con la búsqueda.
                          </div>
                        ) : (
                          <div
                            className="max-h-[240px] overflow-y-auto overscroll-contain pr-2"
                            onWheelCapture={(event) => event.stopPropagation()}
                          >
                            <div className="space-y-2">
                              {filteredResolved.map(renderIncidentCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
                    },
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
