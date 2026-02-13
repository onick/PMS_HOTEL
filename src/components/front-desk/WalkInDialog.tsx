import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

export default function WalkInDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomTypeId: "",
    roomId: "",
    ratePlanId: "",
    adults: "2",
    children: "0",
    infants: "0",
    nights: "1",
    paymentMethod: "cash",
  });

  // Get room types
  const { data: roomTypesRes } = useQuery({
    queryKey: ["room-types"],
    enabled: open,
    queryFn: () => api.getRoomTypes(),
  });

  const roomTypes = roomTypesRes?.data || [];

  // Get rate plans
  const { data: ratePlansRes } = useQuery({
    queryKey: ["rate-plans"],
    enabled: open,
    queryFn: () => api.getRatePlans(),
  });

  const ratePlans = ratePlansRes?.data || [];

  // Get available rooms for selected room type
  const { data: roomsRes } = useQuery({
    queryKey: ["available-rooms-walkin", formData.roomTypeId],
    enabled: open && !!formData.roomTypeId,
    queryFn: () =>
      api.getRooms({
        room_type_id: formData.roomTypeId,
        available_only: "1",
      }),
  });

  const availableRooms = roomsRes?.data || [];

  const walkInMutation = useMutation({
    mutationFn: async () => {
      // Calculate check-out date
      const today = new Date().toISOString().split("T")[0];
      const checkOut = new Date(today);
      checkOut.setDate(checkOut.getDate() + parseInt(formData.nights));
      const checkOutStr = checkOut.toISOString().split("T")[0];

      return api.walkIn({
        guest: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        },
        check_in_date: today,
        check_out_date: checkOutStr,
        units: [
          {
            room_type_id: Number(formData.roomTypeId),
            rate_plan_id: Number(formData.ratePlanId),
            adults: parseInt(formData.adults),
          },
        ],
        room_assignments: [Number(formData.roomId)],
      });
    },
    onSuccess: () => {
      toast.success("Walk-in procesado exitosamente. Huésped registrado y en habitación.");
      queryClient.invalidateQueries({ queryKey: ["today-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["in-house-guests"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-status-grid"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roomTypeId: "",
        roomId: "",
        ratePlanId: "",
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

    if (!formData.firstName || !formData.lastName) {
      toast.error("Por favor completa nombre y apellido del huésped");
      return;
    }

    if (!formData.roomTypeId || !formData.roomId) {
      toast.error("Por favor selecciona tipo de habitación y habitación específica");
      return;
    }

    if (!formData.ratePlanId) {
      toast.error("Por favor selecciona un plan de tarifa");
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
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
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
                  {roomTypes.map((rt: any) => (
                    <SelectItem key={rt.id} value={String(rt.id)}>
                      {rt.name}
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
                    {availableRooms.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No hay habitaciones disponibles</div>
                    ) : (
                      availableRooms.map((room: any) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          Habitación {room.number}
                          {room.floor && ` - Piso ${room.floor}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="ratePlanId">Plan de Tarifa *</Label>
              <Select
                value={formData.ratePlanId}
                onValueChange={(value) => setFormData({ ...formData, ratePlanId: value })}
              >
                <SelectTrigger id="ratePlanId">
                  <SelectValue placeholder="Selecciona plan de tarifa" />
                </SelectTrigger>
                <SelectContent>
                  {ratePlans.map((rp: any) => (
                    <SelectItem key={rp.id} value={String(rp.id)}>
                      {rp.name}
                    </SelectItem>
                  ))}
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
