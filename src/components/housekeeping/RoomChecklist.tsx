import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: rooms } = useQuery({
    queryKey: ["maintenance-rooms"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data, error } = await supabase
        .from("rooms")
        .select("*, room_type:room_types(name)")
        .eq("hotel_id", userRoles.hotel_id)
        .eq("status", "MAINTENANCE")
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const { data: activeChecklist } = useQuery({
    queryKey: ["active-checklist", selectedRoom],
    queryFn: async () => {
      if (!selectedRoom) return null;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const { data, error } = await supabase
        .from("cleaning_checklists")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .eq("room_id", selectedRoom)
        .is("completed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedRoom,
  });

  const startChecklistMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .limit(1)
        .single();

      if (!userRoles) throw new Error("No hotel found");

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not found");

      const items = DEFAULT_CHECKLIST_ITEMS.map((task) => ({
        task,
        completed: false,
      }));

      const { error } = await supabase.from("cleaning_checklists").insert({
        hotel_id: userRoles.hotel_id,
        room_id: roomId,
        assigned_to: user.id,
        items: JSON.parse(JSON.stringify(items)),
        started_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checklist"] });
      toast({ title: "Checklist iniciado" });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({
      checklistId,
      items,
    }: {
      checklistId: string;
      items: ChecklistItem[];
    }) => {
      const { error } = await supabase
        .from("cleaning_checklists")
        .update({ items: JSON.parse(JSON.stringify(items)) })
        .eq("id", checklistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checklist"] });
    },
  });

  const completeChecklistMutation = useMutation({
    mutationFn: async ({
      checklistId,
      roomId,
    }: {
      checklistId: string;
      roomId: string;
    }) => {
      const { error: checklistError } = await supabase
        .from("cleaning_checklists")
        .update({
          completed_at: new Date().toISOString(),
          status: "COMPLETED",
          notes,
        })
        .eq("id", checklistId);

      if (checklistError) throw checklistError;

      const { error: roomError } = await supabase
        .from("rooms")
        .update({ status: "AVAILABLE" })
        .eq("id", roomId);

      if (roomError) throw roomError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checklist"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-rooms"] });
      setSelectedRoom(null);
      setNotes("");
      toast({ title: "Limpieza completada", description: "Habitación marcada como disponible" });
    },
  });

  const handleToggleItem = (index: number) => {
    if (!activeChecklist) return;

    const items = [...(activeChecklist.items as any as ChecklistItem[])];
    items[index].completed = !items[index].completed;

    updateChecklistMutation.mutate({
      checklistId: activeChecklist.id,
      items: items as any,
    });
  };

  const items = (activeChecklist?.items as any as ChecklistItem[]) || [];
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
            {rooms && rooms.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">¡Todo en orden!</p>
                  <p className="text-sm text-muted-foreground">
                    No hay habitaciones que requieran mantenimiento
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona una habitación para iniciar el checklist:
                </p>
                {rooms?.map((room) => (
                  <Button
                    key={room.id}
                    variant="outline"
                    className="w-full justify-between hover:bg-housekeeping/10 hover:border-housekeeping transition-all"
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <span>
                      Habitación {room.room_number} - {room.room_type?.name}
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
                  Habitación {rooms?.find((r) => r.id === selectedRoom)?.room_number}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progreso: {completedCount} / {items.length} tareas
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>
                Cambiar habitación
              </Button>
            </div>

            {!activeChecklist ? (
              <Button
                onClick={() => startChecklistMutation.mutate(selectedRoom)}
                disabled={startChecklistMutation.isPending}
                className="w-full"
              >
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
                  onClick={() =>
                    completeChecklistMutation.mutate({
                      checklistId: activeChecklist.id,
                      roomId: selectedRoom,
                    })
                  }
                  disabled={
                    completeChecklistMutation.isPending || progress < 100
                  }
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
