import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
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
import { Package, Loader2, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useChannelOutbox } from "@/hooks/useChannels";
import type { ChannelConnectionData } from "@/lib/api";

interface Props {
    connection: ChannelConnectionData;
    open: boolean;
    onClose: () => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
    PENDING: { icon: <Clock className="h-3 w-3" />, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
    PROCESSING: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, className: "bg-blue-500/10 text-blue-600 border-blue-200" },
    SENT: { icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    FAILED: { icon: <XCircle className="h-3 w-3" />, className: "bg-red-500/10 text-red-600 border-red-200" },
};

export default function ChannelOutboxViewer({ connection, open, onClose }: Props) {
    const { data, isLoading } = useChannelOutbox(connection.id, open);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-500" />
                        Outbox — Cola de Envío
                    </DialogTitle>
                    <DialogDescription>
                        Items pendientes de enviar a la OTA
                    </DialogDescription>
                </DialogHeader>

                {/* Stats */}
                {data?.stats && (
                    <div className="flex gap-4 text-sm">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            {data.stats.pending} pendientes
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {data.stats.processing} procesando
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                            {data.stats.failed} fallidos
                        </Badge>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : !data?.items?.length ? (
                    <p className="text-center text-muted-foreground py-12">
                        No hay items en el outbox 🎉
                    </p>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Room Type</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Intentos</TableHead>
                                    <TableHead>Próximo retry</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((item) => {
                                    const sc = statusConfig[item.status] ?? statusConfig.PENDING;
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{item.type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.date}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.room_type_id}</TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs ${sc.className}`}>
                                                    {sc.icon}
                                                    <span className="ml-1">{item.status}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                                {item.attempts}/{item.max_attempts}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {item.next_retry_at
                                                    ? new Date(item.next_retry_at).toLocaleString("es-DO", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-red-500 max-w-[200px] truncate" title={item.last_error ?? ""}>
                                                {item.last_error ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
