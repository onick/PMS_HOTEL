import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function GDPRRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["gdpr-requests"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data, error } = await supabase
        .from("data_requests")
        .select(`
          *,
          guest:guest_id(name, email)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes: requestNotes }: { id: string; status: string; notes?: string }) => {
      const update: any = { status, notes: requestNotes };
      
      if (status === "COMPLETED") {
        update.completed_at = new Date().toISOString();
        update.completed_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from("data_requests")
        .update(update)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gdpr-requests"] });
      setSelectedRequest(null);
      setNotes("");
      toast({ title: "Solicitud actualizada correctamente" });
    },
  });

  const requestTypeLabels: Record<string, string> = {
    access: "Acceso a Datos",
    rectification: "Rectificación",
    erasure: "Derecho al Olvido",
    portability: "Portabilidad",
  };

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    PENDING: { color: "bg-warning", icon: Clock, label: "Pendiente" },
    PROCESSING: { color: "bg-front-desk", icon: Clock, label: "En Proceso" },
    COMPLETED: { color: "bg-success", icon: CheckCircle, label: "Completada" },
    REJECTED: { color: "bg-destructive", icon: XCircle, label: "Rechazada" },
  };

  const pendingRequests = requests?.filter(r => r.status === "PENDING") || [];
  const processingRequests = requests?.filter(r => r.status === "PROCESSING") || [];
  const completedRequests = requests?.filter(r => r.status === "COMPLETED" || r.status === "REJECTED") || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Solicitudes RGPD
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length} pendientes
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gestión de derechos de los titulares de datos (Artículos 15-22 RGPD)
          </p>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : requests?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes RGPD
            </div>
          ) : (
            <div className="space-y-6">
              {/* Solicitudes Pendientes */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Pendientes ({pendingRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingRequests.map((request: any) => {
                      const StatusIcon = statusConfig[request.status].icon;
                      return (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border-2 border-warning bg-warning/5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-warning">
                                  {requestTypeLabels[request.request_type]}
                                </Badge>
                                <Badge variant="secondary">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[request.status].label}
                                </Badge>
                              </div>
                              <p className="font-medium">
                                Huésped: {request.guest?.name || "Desconocido"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.guest?.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Solicitado: {new Date(request.requested_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {selectedRequest === request.id ? (
                            <div className="space-y-3 mt-3 pt-3 border-t">
                              <Textarea
                                placeholder="Notas sobre el procesamiento..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    processRequestMutation.mutate({
                                      id: request.id,
                                      status: "PROCESSING",
                                      notes,
                                    })
                                  }
                                >
                                  Marcar en Proceso
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedRequest(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request.id)}
                              className="mt-3"
                            >
                              Procesar Solicitud
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solicitudes en Proceso */}
              {processingRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-front-desk" />
                    En Proceso ({processingRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {processingRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {requestTypeLabels[request.request_type]}
                            </Badge>
                            <p className="font-medium">
                              Huésped: {request.guest?.name || "Desconocido"}
                            </p>
                            {request.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Notas: {request.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-success text-white"
                              onClick={() =>
                                processRequestMutation.mutate({
                                  id: request.id,
                                  status: "COMPLETED",
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Completar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                processRequestMutation.mutate({
                                  id: request.id,
                                  status: "REJECTED",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de Solicitudes Completadas */}
              {completedRequests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Historial ({completedRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {completedRequests.map((request: any) => {
                      const StatusIcon = statusConfig[request.status].icon;
                      return (
                        <div
                          key={request.id}
                          className="p-3 rounded-lg border text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${request.status === "COMPLETED" ? "text-success" : "text-destructive"}`} />
                              <span>{requestTypeLabels[request.request_type]}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="font-medium">{request.guest?.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {request.completed_at
                                ? new Date(request.completed_at).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Derechos RGPD Implementados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">✓ Derecho de Acceso (Art. 15)</h4>
              <p className="text-sm text-muted-foreground">
                Los huéspedes pueden solicitar una copia de todos sus datos personales.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">✓ Derecho de Rectificación (Art. 16)</h4>
              <p className="text-sm text-muted-foreground">
                Corrección de datos inexactos o incompletos.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">✓ Derecho al Olvido (Art. 17)</h4>
              <p className="text-sm text-muted-foreground">
                Supresión de datos cuando ya no sean necesarios.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">✓ Derecho a la Portabilidad (Art. 20)</h4>
              <p className="text-sm text-muted-foreground">
                Exportación de datos en formato estructurado (JSON/CSV).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
