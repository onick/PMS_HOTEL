import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Hotel,
  User,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Home,
  Clock,
  DollarSign,
  LogOut,
  Receipt,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function InHouseGuests() {
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: inHouse, refetch } = useQuery({
    queryKey: ["in-house-guests"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name),
          rooms (room_number),
          folios (
            id,
            balance_cents,
            currency
          )
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("status", "CHECKED_IN")
        .order("check_out", { ascending: true });

      if (error) {
        console.error("Error fetching in-house guests:", error);
        throw error;
      }
      return data || [];
    },
  });

  const handleCheckOut = async () => {
    if (!selectedGuest) return;

    setCheckingOut(true);
    try {
      // Check if there's an outstanding balance
      const folio = selectedGuest.folios?.[0];
      if (folio && folio.balance_cents > 0) {
        toast.error(`No se puede hacer check-out. El huésped tiene un balance pendiente de ${(folio.balance_cents / 100).toFixed(2)} ${folio.currency}`);
        return;
      }

      // Update reservation status to CHECKED_OUT
      const { error: resError } = await supabase
        .from("reservations")
        .update({
          status: "CHECKED_OUT",
          metadata: {
            ...(selectedGuest.metadata || {}),
            checked_out_at: new Date().toISOString()
          }
        })
        .eq("id", selectedGuest.id);

      if (resError) {
        console.error("Error updating reservation:", resError);
        throw new Error(`Error al actualizar reserva: ${resError.message}${resError.hint ? ` - ${resError.hint}` : ''}`);
      }

      // Update room status to DIRTY
      if (selectedGuest.room_id) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "DIRTY" })
          .eq("id", selectedGuest.room_id);

        if (roomError) {
          console.error("Error updating room:", roomError);
          throw new Error(`Error al actualizar habitación: ${roomError.message}${roomError.hint ? ` - ${roomError.hint}` : ''}`);
        }
      }

      toast.success("Check-out realizado exitosamente");
      setSelectedGuest(null);
      refetch();
    } catch (error: any) {
      console.error("Check-out error details:", error);
      toast.error(error.message || "Error al realizar check-out");
    } finally {
      setCheckingOut(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = "DOP") => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-front-desk">
          <Hotel className="h-5 w-5" />
          Huéspedes en Casa ({inHouse?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inHouse?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay huéspedes actualmente en el hotel
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {inHouse.map((reservation: any) => {
              const roomNumber = reservation.rooms?.room_number || "Sin asignar";
              const nightsRemaining = Math.ceil(
                (new Date(reservation.check_out).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
              );
              const folio = reservation.folios?.[0];
              const balance = folio ? folio.balance_cents / 100 : 0;

              return (
                <div
                  key={reservation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedGuest(reservation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{reservation.customer.name}</span>
                      {balance > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Balance pendiente
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-front-desk">
                      Hab. {roomNumber}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{reservation.room_types?.name}</p>
                      <p>{reservation.guests} huéspedes</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3" />
                        Salida: {formatDate(reservation.check_out)}
                      </p>
                      <p className={nightsRemaining <= 1 ? "text-warning font-medium" : ""}>
                        {nightsRemaining} {nightsRemaining === 1 ? "noche" : "noches"} restantes
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Guest Details Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Información del Huésped</DialogTitle>
            <DialogDescription>
              Detalles completos de la estadía actual
            </DialogDescription>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-6">
              {/* Guest Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Información Personal
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedGuest.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedGuest.customer.email}</span>
                  </div>
                  {selectedGuest.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedGuest.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Stay Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Habitación
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Número:</span>
                      <span className="font-medium">
                        {selectedGuest.rooms?.room_number || "Sin asignar"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{selectedGuest.room_types?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Huéspedes:</span>
                      <span className="font-medium">{selectedGuest.guests}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Fechas de Estadía
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Check-in:</span>
                      <span className="font-medium">{formatDate(selectedGuest.check_in)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Check-out:</span>
                      <span className="font-medium">{formatDate(selectedGuest.check_out)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Noches restantes:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(selectedGuest.check_out).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Folio Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Balance del Folio
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  {selectedGuest.folios?.[0] ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Balance actual:</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className={`font-bold text-lg ${
                          selectedGuest.folios[0].balance_cents > 0 ? "text-destructive" : "text-success"
                        }`}>
                          {formatCurrency(
                            selectedGuest.folios[0].balance_cents,
                            selectedGuest.folios[0].currency
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">No hay folio asociado</p>
                  )}

                  {selectedGuest.folios?.[0]?.balance_cents > 0 && (
                    <div className="mt-3 flex items-start gap-2 text-warning text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>El huésped debe saldar el balance antes de realizar check-out</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Additional Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Información Adicional
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID de Reserva:</span>
                    <span className="font-mono">{selectedGuest.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in realizado:</span>
                    <span>
                      {selectedGuest.metadata?.checked_in_at
                        ? formatDate(selectedGuest.metadata.checked_in_at)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total estadía:</span>
                    <span>
                      {formatCurrency(selectedGuest.total_amount_cents, selectedGuest.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedGuest(null)}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCheckOut}
              disabled={checkingOut || (selectedGuest?.folios?.[0]?.balance_cents > 0)}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {checkingOut ? "Procesando..." : "Realizar Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
