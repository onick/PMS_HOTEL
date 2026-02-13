import { useChannelStats } from "@/hooks/useChannels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Activity,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FlaskConical,
} from "lucide-react";

const directionIcon = {
    PUSH: <ArrowUpRight className="h-4 w-4 text-blue-500" />,
    PULL: <ArrowDownLeft className="h-4 w-4 text-emerald-500" />,
};

const statusBadge = {
    SUCCESS: <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>,
    PARTIAL: <Badge className="bg-amber-500/10 text-amber-600 border-amber-200"><AlertTriangle className="h-3 w-3 mr-1" />Parcial</Badge>,
    FAILED: <Badge className="bg-red-500/10 text-red-600 border-red-200"><XCircle className="h-3 w-3 mr-1" />Error</Badge>,
};

export default function SyncLogsTable() {
    const { data: stats, isLoading } = useChannelStats();
    const logs = stats?.recent_logs ?? [];

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Cargando logs de sincronización...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    Historial de Sincronización
                    {stats?.pending_outbox ? (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                            {stats.pending_outbox} pendientes en outbox
                        </Badge>
                    ) : null}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        No hay operaciones de sincronización recientes
                    </p>
                ) : (
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Dir.</TableHead>
                                    <TableHead>Canal</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Procesados</TableHead>
                                    <TableHead className="text-right">Errores</TableHead>
                                    <TableHead>Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className={log.dry_run ? "opacity-60" : ""}>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {directionIcon[log.direction as keyof typeof directionIcon]}
                                                {log.dry_run && <FlaskConical className="h-3 w-3 text-violet-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.channel ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {log.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {statusBadge[log.status as keyof typeof statusBadge] ?? log.status}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {log.items_processed}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {log.items_failed > 0 ? (
                                                <span className="text-red-500">{log.items_failed}</span>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('es-DO', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
