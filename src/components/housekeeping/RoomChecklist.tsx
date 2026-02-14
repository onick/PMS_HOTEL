import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_CHECKLIST_ITEMS = [
  "Cambiar sábanas y fundas",
  "Limpiar baño completo",
  "Reponer amenidades",
  "Aspirar alfombra/piso",
  "Limpiar espejos y cristales",
  "Vaciar papeleras",
  "Revisar minibar",
  "Verificar toallas (2 por persona)",
  "Limpiar escritorio y superficies",
  "Verificar TV y controles remotos",
];

interface ChecklistItem {
  task: string;
  completed: boolean;
}

export default function RoomChecklist() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checklistStarted, setChecklistStarted] = useState(false);

  const { data: statusGrid } = useQuery({
    queryKey: ["checklist-rooms"],
    queryFn: async () => {
      const res = await api.getStatusGrid();
      return res.data || [];
    },
  });

  // Filter rooms that need cleaning (DIRTY housekeeping status)
  const dirtyRooms = (statusGrid as any[])?.filter(
    (r: any) => r.housekeeping_status === "DIRTY"
  ) || [];

  const handleToggleItem = (index: number) => {
    const updated = [...items];
    updated[index].completed = !updated[index].completed;
    setItems(updated);
  };

  const startChecklist = () => {
    setItems(DEFAULT_CHECKLIST_ITEMS.map((task) => ({ task, completed: false })));
    setChecklistStarted(true);
  };

  const completeChecklist = async () => {
    if (!selectedRoom) return;
    try {
      const room = dirtyRooms.find((r: any) => String(r.id) === selectedRoom);
      if (room) {
        await api.markRoomClean(Number(selectedRoom));
      }
      toast.success("Limpieza completada. Habitación marcada como disponible.");
      setSelectedRoom(null);
      setNotes("");
      setItems([]);
      setChecklistStarted(false);
    } catch {
      toast.error("Error al completar checklist");
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Checklist de Limpieza
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedRoom ? (
          <>
            {dirtyRooms.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">¡Todo en orden!</p>
                  <p className="text-sm text-muted-foreground">
                    No hay habitaciones que requieran limpieza
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona una habitación para iniciar el checklist:
                </p>
                {dirtyRooms.map((room: any) => (
                  <Button
                    key={room.id}
                    variant="outline"
                    className="w-full justify-between hover:bg-housekeeping/10 hover:border-housekeeping transition-all"
                    onClick={() => setSelectedRoom(String(room.id))}
                  >
                    <span>
                      Habitación {room.number} - {room.room_type?.name}
                    </span>
                    <Badge variant="secondary">Requiere limpieza</Badge>
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  Habitación {dirtyRooms.find((r: any) => String(r.id) === selectedRoom)?.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progreso: {completedCount} / {items.length} tareas
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedRoom(null); setChecklistStarted(false); setItems([]); }}>
                Cambiar habitación
              </Button>
            </div>

            {!checklistStarted ? (
              <Button onClick={startChecklist} className="w-full">
                Iniciar Checklist
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleItem(index)}
                      />
                      <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                        {item.task}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas (opcional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade observaciones sobre la limpieza..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={completeChecklist}
                  disabled={progress < 100}
                  className="w-full"
                >
                  {progress < 100
                    ? `Completar todas las tareas (${Math.round(progress)}%)`
                    : "Finalizar y marcar como disponible"}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
