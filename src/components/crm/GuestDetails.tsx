import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

  // Fetch full guest details from Laravel API
  const { data: guestDetails } = useQuery({
    queryKey: ["guest-details", guest?.id],
    enabled: !!guest?.id && open,
    queryFn: async () => {
      const res = await api.getGuest(guest.id);
      return res.data;
    },
  });

  const displayGuest = guestDetails || guest;

  // Fetch guest reservations
  const { data: reservationsRes } = useQuery({
    queryKey: ["guest-reservations", guest?.id],
    enabled: !!guest?.id && open,
    queryFn: async () => {
      return api.getGuestReservations(guest.id);
    },
  });

  const reservations = reservationsRes?.data || [];

  // Notes come from guestDetails (loaded via show endpoint)
  const notes = displayGuest?.notes || [];

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.addGuestNote(guest.id, { content });
    },
    onSuccess: () => {
      toast.success("Nota agregada correctamente");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["guest-details", guest.id] });
    },
    onError: () => {
      toast.error("Error al agregar nota");
    },
  });

  const toggleVIPMutation = useMutation({
    mutationFn: async () => {
      const newLevel = displayGuest.vip_level ? null : "GOLD";
      return api.updateGuest(guest.id, { vip_level: newLevel });
    },
    onSuccess: () => {
      toast.success("Estado VIP actualizado");
      queryClient.invalidateQueries({ queryKey: ["guest-details", guest.id] });
      queryClient.invalidateQueries({ queryKey: ["guests-list"] });
    },
    onError: () => {
      toast.error("Error al cambiar estado VIP");
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
              {displayGuest.full_name || `${displayGuest.first_name || ""} ${displayGuest.last_name || ""}`}
            </span>
            <Button
              variant={displayGuest.vip_level ? "default" : "outline"}
              size="sm"
              onClick={() => toggleVIPMutation.mutate()}
              className={displayGuest.vip_level ? "bg-crm hover:bg-crm/90" : ""}
            >
              <Star className="h-3 w-3 mr-1" />
              {displayGuest.vip_level ? `VIP ${displayGuest.vip_level}` : "Marcar VIP"}
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
                {displayGuest.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{displayGuest.email}</span>
                  </div>
                )}
                {displayGuest.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{displayGuest.phone}</span>
                  </div>
                )}
                {(displayGuest.country || displayGuest.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[displayGuest.city, displayGuest.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {displayGuest.nationality && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Nacionalidad: {displayGuest.nationality}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border rounded">
                    <p className="text-2xl font-bold">{displayGuest.total_stays || 0}</p>
                    <p className="text-xs text-muted-foreground">Estadías</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-2xl font-bold">${displayGuest.total_spent || "0.00"}</p>
                    <p className="text-xs text-muted-foreground">Total gastado</p>
                  </div>
                </div>
              </div>
            </div>

            {displayGuest.preferences && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Preferencias</h4>
                  <p className="text-sm">{displayGuest.preferences}</p>
                </div>
              </>
            )}

            {displayGuest.allergies && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Alergias</h4>
                <p className="text-sm text-destructive">{displayGuest.allergies}</p>
              </div>
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
                          <p className="font-semibold">
                            {reservation.units?.[0]?.room_type?.name || "—"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {reservation.check_in_date} - {reservation.check_out_date}
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
                          ${(reservation.total_cents / 100).toFixed(2)}
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
                      <p className="text-sm mb-2">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.user?.name || "Usuario"}</span>
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
