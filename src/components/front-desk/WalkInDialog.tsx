import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface WalkInDialogProps {
  hotelId: string;
}

export default function WalkInDialog({ hotelId }: WalkInDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    roomTypeId: "",
    roomId: "",
    adults: "2",
    children: "0",
    infants: "0",
    nights: "1",
    paymentMethod: "cash",
  });

  const today = new Date().toISOString().split("T")[0];

  // Get room types
  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", hotelId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Get available rooms for selected room type
  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", hotelId, formData.roomTypeId],
    enabled: open && !!formData.roomTypeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("room_type_id", formData.roomTypeId)
        .eq("status", "AVAILABLE")
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const walkInMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Calculate check-out date
      const checkOut = new Date(today);
      checkOut.setDate(checkOut.getDate() + parseInt(formData.nights));
      const checkOutStr = checkOut.toISOString().split("T")[0];

      // Step 1: Create reservation
      const createReservationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            idempotencyKey: `walk-in-${Date.now()}-${Math.random()}`,
            hotelId,
            roomTypeId: formData.roomTypeId,
            checkIn: today,
            checkOut: checkOutStr,
            guests: parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants),
            guestBreakdown: {
              adults: parseInt(formData.adults),
              children: parseInt(formData.children),
              infants: parseInt(formData.infants),
            },
            customer: {
              name: formData.customerName,
              email: formData.customerEmail,
              phone: formData.customerPhone,
            },
            ratePlanId: "c4444444-4444-4444-4444-444444444444", // Default rate plan
            currency: "DOP",
            payment: {
              strategy: "pay_at_hotel",
            },
            metadata: {
              walkIn: true,
              paymentMethod: formData.paymentMethod,
            },
          }),
        }
      );

      const reservationData = await createReservationResponse.json();
      if (!createReservationResponse.ok) {
        throw new Error(reservationData.error || "Error creating reservation");
      }

      // Step 2: Confirm payment (since it's walk-in, we assume payment is handled)
      const confirmResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-reservation-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            reservationId: reservationData.reservationId,
            paymentMethod: formData.paymentMethod,
          }),
        }
      );

      if (!confirmResponse.ok) {
        const confirmError = await confirmResponse.json();
        throw new Error(confirmError.error || "Error confirming payment");
      }

      // Step 3: Check-in immediately
      const checkInResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            reservationId: reservationData.reservationId,
            roomId: formData.roomId,
            notes: "Walk-in guest",
          }),
        }
      );

      if (!checkInResponse.ok) {
        const checkInError = await checkInResponse.json();
        throw new Error(checkInError.error || "Error during check-in");
      }

      return await checkInResponse.json();
    },
    onSuccess: () => {
      toast.success("Walk-in procesado exitosamente. Huésped registrado y en habitación.");
      queryClient.invalidateQueries({ queryKey: ["today-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-status"] });
      setOpen(false);
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        roomTypeId: "",
        roomId: "",
        adults: "2",
        children: "0",
        infants: "0",
        nights: "1",
        paymentMethod: "cash",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error procesando walk-in");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail) {
      toast.error("Por favor completa nombre y email del huésped");
      return;
    }

    if (!formData.roomTypeId || !formData.roomId) {
      toast.error("Por favor selecciona tipo de habitación y habitación específica");
      return;
    }

    walkInMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-front-desk hover:bg-front-desk/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Walk-In
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Walk-In</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Información del Huésped</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nombre Completo *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerPhone">Teléfono</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>
          </div>

          {/* Stay Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Información de Estadía</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="adults">Adultos</Label>
                <Select value={formData.adults} onValueChange={(value) => setFormData({ ...formData, adults: value })}>
                  <SelectTrigger id="adults">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="children">Niños</Label>
                <Select value={formData.children} onValueChange={(value) => setFormData({ ...formData, children: value })}>
                  <SelectTrigger id="children">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="infants">Bebés</Label>
                <Select value={formData.infants} onValueChange={(value) => setFormData({ ...formData, infants: value })}>
                  <SelectTrigger id="infants">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="nights">Noches de Estadía</Label>
              <Select value={formData.nights} onValueChange={(value) => setFormData({ ...formData, nights: value })}>
                <SelectTrigger id="nights">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "noche" : "noches"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Selección de Habitación</h3>

            <div>
              <Label htmlFor="roomTypeId">Tipo de Habitación *</Label>
              <Select
                value={formData.roomTypeId}
                onValueChange={(value) => setFormData({ ...formData, roomTypeId: value, roomId: "" })}
              >
                <SelectTrigger id="roomTypeId">
                  <SelectValue placeholder="Selecciona tipo de habitación" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes?.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name} - ${(rt.base_price_cents / 100).toFixed(2)}/noche
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.roomTypeId && (
              <div>
                <Label htmlFor="roomId">Habitación Disponible *</Label>
                <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value })}>
                  <SelectTrigger id="roomId">
                    <SelectValue placeholder="Selecciona habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No hay habitaciones disponibles</div>
                    ) : (
                      availableRooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Habitación {room.room_number}
                          {room.floor && ` - Piso ${room.floor}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Método de Pago</h3>

            <div>
              <Label htmlFor="paymentMethod">Forma de Pago</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={walkInMutation.isPending} className="bg-front-desk hover:bg-front-desk/90">
              {walkInMutation.isPending ? "Procesando..." : "Registrar Walk-In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
