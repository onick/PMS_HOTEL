import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // TODO: Wire up when backend audit logs endpoint is available
  const logs: any[] = [];
  const isLoading = false;

  const actionConfig: Record<string, { color: string; label: string }> = {
    INSERT: { color: "bg-success", label: "Creado" },
    UPDATE: { color: "bg-warning", label: "Modificado" },
    DELETE: { color: "bg-destructive", label: "Eliminado" },
    READ: { color: "bg-front-desk", label: "Consultado" },
    EXPORT: { color: "bg-channels", label: "Exportado" },
  };

  const filteredLogs = logs.filter((log) =>
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registro de Auditoría
          </CardTitle>
          <Button size="sm" variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por entidad o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="INSERT">Creaciones</SelectItem>
              <SelectItem value="UPDATE">Modificaciones</SelectItem>
              <SelectItem value="DELETE">Eliminaciones</SelectItem>
              <SelectItem value="READ">Consultas</SelectItem>
              <SelectItem value="EXPORT">Exportaciones</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron registros de auditoría
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={actionConfig[log.action]?.color || ""}>
                        {actionConfig[log.action]?.label || log.action}
                      </Badge>
                      <span className="font-semibold">{log.entity_type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
