import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import {
    useRoomTypeMappings,
    useSaveRoomTypeMapping,
    useDeleteRoomTypeMapping,
} from "@/hooks/useChannels";
import type { ChannelConnectionData } from "@/lib/api";

interface Props {
    connection: ChannelConnectionData;
    open: boolean;
    onClose: () => void;
}

export default function ChannelMappingsDialog({ connection, open, onClose }: Props) {
    const { data: mappings, isLoading } = useRoomTypeMappings(connection.id, open);
    const saveMutation = useSaveRoomTypeMapping();
    const deleteMutation = useDeleteRoomTypeMapping();

    const [newRoomTypeId, setNewRoomTypeId] = useState("");
    const [newOtaCode, setNewOtaCode] = useState("");
    const [newOtaName, setNewOtaName] = useState("");

    const handleAdd = () => {
        if (!newRoomTypeId || !newOtaCode) return;
        saveMutation.mutate(
            {
                connectionId: connection.id,
                data: {
                    room_type_id: parseInt(newRoomTypeId),
                    ota_room_type_code: newOtaCode,
                    ota_room_type_name: newOtaName || undefined,
                },
            },
            {
                onSuccess: () => {
                    setNewRoomTypeId("");
                    setNewOtaCode("");
                    setNewOtaName("");
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        Room Type Mappings
                    </DialogTitle>
                    <DialogDescription>
                        Mapea los tipos de habitación internos con los códigos de la OTA
                    </DialogDescription>
                </DialogHeader>

                {/* Existing mappings */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : mappings && mappings.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room Type ID</TableHead>
                                <TableHead>Nombre Interno</TableHead>
                                <TableHead>Código OTA</TableHead>
                                <TableHead>Nombre OTA</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mappings.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-mono">{m.room_type_id}</TableCell>
                                    <TableCell>{m.room_type_name ?? "—"}</TableCell>
                                    <TableCell className="font-mono">{m.ota_room_type_code}</TableCell>
                                    <TableCell>{m.ota_room_type_name ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={m.is_active ? "default" : "secondary"} className="text-xs">
                                            {m.is_active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() =>
                                                deleteMutation.mutate({
                                                    connectionId: connection.id,
                                                    mappingId: m.id,
                                                })
                                            }
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-6">
                        No hay mappings configurados. Agrega uno abajo.
                    </p>
                )}

                {/* Add new */}
                <div className="border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Agregar mapping
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Room Type ID</Label>
                            <Input
                                type="number"
                                placeholder="1"
                                value={newRoomTypeId}
                                onChange={(e) => setNewRoomTypeId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Código OTA</Label>
                            <Input
                                placeholder="DBL_STANDARD"
                                value={newOtaCode}
                                onChange={(e) => setNewOtaCode(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Nombre OTA (opt)</Label>
                            <Input
                                placeholder="Double Standard"
                                value={newOtaName}
                                onChange={(e) => setNewOtaName(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={saveMutation.isPending || !newRoomTypeId || !newOtaCode}
                        className="mt-3 w-full"
                    >
                        {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar Mapping
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
