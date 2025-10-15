import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Calendar, DollarSign, MessageSquare, Star } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";

interface GuestDetailsProps {
  guest: any;
  open: boolean;
  onClose: () => void;
}

export default function GuestDetails({ guest, open, onClose }: GuestDetailsProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: reservations } = useQuery({
    queryKey: ["guest-reservations", guest?.id],
    enabled: !!guest?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", guest.hotel_id)
        .contains("customer", { email: guest.email })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["guest-notes", guest?.id],
    enabled: !!guest?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_notes")
        .select(`
          *,
          profiles (full_name)
        `)
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("guest_notes")
        .insert({
          hotel_id: guest.hotel_id,
          guest_id: guest.id,
          user_id: user.user?.id,
          note: note,
          note_type: "general",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota agregada correctamente");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["guest-notes"] });
    },
    onError: (error: any) => {
      toast.error("Error al agregar nota: " + error.message);
    },
  });

  const toggleVIPMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("guests")
        .update({ vip_status: !guest.vip_status })
        .eq("id", guest.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Estado VIP ${!guest.vip_status ? "activado" : "desactivado"}`);
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error("Error al cambiar estado VIP: " + error.message);
    },
  });

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {guest.name}
            </span>
            <Button
              variant={guest.vip_status ? "default" : "outline"}
              size="sm"
              onClick={() => toggleVIPMutation.mutate()}
              className={guest.vip_status ? "bg-crm hover:bg-crm/90" : ""}
            >
              <Star className="h-3 w-3 mr-1" />
              {guest.vip_status ? "VIP" : "Marcar VIP"}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Información completa del huésped
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Contacto</h4>
                {guest.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{guest.email}</span>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{guest.phone}</span>
                  </div>
                )}
                {guest.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{guest.country}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border rounded">
                    <p className="text-2xl font-bold">{guest.total_stays}</p>
                    <p className="text-xs text-muted-foreground">Estadías</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-2xl font-bold">${((guest.total_spent_cents || 0) / 100).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Total gastado</p>
                  </div>
                </div>
              </div>
            </div>

            {guest.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Notas generales</h4>
                  <p className="text-sm">{guest.notes}</p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[400px]">
              {!reservations?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay historial de reservas
                </p>
              ) : (
                <div className="space-y-3">
                  {reservations.map((reservation: any) => (
                    <div key={reservation.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{reservation.room_types?.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                            </span>
                          </div>
                        </div>
                        <Badge variant={
                          reservation.status === "CHECKED_OUT" ? "default" :
                          reservation.status === "CHECKED_IN" ? "secondary" :
                          "outline"
                        }>
                          {reservation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">
                          ${(reservation.total_amount_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Agregar nueva nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button
                onClick={() => newNote && addNoteMutation.mutate(newNote)}
                disabled={!newNote || addNoteMutation.isPending}
                size="sm"
                className="bg-crm hover:bg-crm/90"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar Nota
              </Button>
            </div>

            <Separator />

            <ScrollArea className="h-[300px]">
              {!notes?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay notas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <p className="text-sm mb-2">{note.note}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.profiles?.full_name || "Usuario"}</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
