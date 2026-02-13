import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Percent } from "lucide-react";
import { toast } from "sonner";

const NewReservationDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    adults: "2",
    children: "0",
    infants: "0",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roomTypeId: "",
    ratePlanId: "",
  });

  // Fetch rate plans from Laravel API
  const { data: ratePlansRes } = useQuery({
    queryKey: ["rate-plans"],
    enabled: open,
    queryFn: () => api.getRatePlans(),
  });

  const ratePlans = ratePlansRes?.data || [];

  // Fetch room types from Laravel API
  const { data: roomTypesRes } = useQuery({
    queryKey: ["room-types"],
    enabled: open,
    queryFn: () => api.getRoomTypes(),
  });

  const roomTypes = roomTypesRes?.data || [];

  // Calculate price preview (client-side estimation)
  const calculatePrice = () => {
    if (!formData.checkIn || !formData.checkOut || !formData.roomTypeId || !roomTypes.length) {
      return null;
    }

    const roomType = roomTypes.find((rt: any) => String(rt.id) === formData.roomTypeId);
    if (!roomType) return null;

    const nights = Math.ceil(
      (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) return null;

    const basePriceCents = roomType.base_rate_cents || roomType.base_price_cents || 0;
    const basePrice = (basePriceCents / 100) * nights;

    // Rate plan adjustment
    const selectedRatePlan = ratePlans.find((rp: any) => String(rp.id) === formData.ratePlanId);
    let ratePlanDiscount = 0;
    if (selectedRatePlan?.modifier_type === "percentage" && selectedRatePlan?.modifier_value) {
      ratePlanDiscount = (basePrice * selectedRatePlan.modifier_value) / 100;
    }

    const subtotal = basePrice - ratePlanDiscount;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return { basePrice, nights, ratePlanDiscount, subtotal, tax, total };
  };

  const pricePreview = calculatePrice();

  const createReservationMutation = useMutation({
    mutationFn: async () => {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);

      if (checkInDate >= checkOutDate) {
        throw new Error("La fecha de check-out debe ser posterior a la fecha de check-in");
      }

      // Step 1: Create guest
      const guestRes = await api.createGuest({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      const guestId = guestRes.data.id;

      // Step 2: Create reservation with guest_id
      return api.createReservation({
        guest_id: guestId,
        check_in_date: formData.checkIn,
        check_out_date: formData.checkOut,
        source: "DIRECT",
        units: [
          {
            room_type_id: Number(formData.roomTypeId),
            rate_plan_id: Number(formData.ratePlanId),
            adults: parseInt(formData.adults),
            children: parseInt(formData.children),
            infants: parseInt(formData.infants),
          },
        ],
      });
    },
    onSuccess: () => {
      toast.success("Reserva creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["today-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setOpen(false);
      setFormData({
        checkIn: "",
        checkOut: "",
        adults: "2",
        children: "0",
        infants: "0",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roomTypeId: "",
        ratePlanId: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear reserva");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      toast.error("Por favor completa nombre y apellido del huésped");
      return;
    }

    if (!formData.roomTypeId || !formData.ratePlanId) {
      toast.error("Por favor selecciona tipo de habitación y plan de tarifa");
      return;
    }

    createReservationMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-ocean hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Reserva</DialogTitle>
          <DialogDescription>
            Complete los datos para crear una nueva reserva
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                required
                min={formData.checkIn || new Date().toISOString().split("T")[0]}
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adults">Adultos</Label>
              <Select value={formData.adults} onValueChange={(value) => setFormData({ ...formData, adults: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Niños (3-12)</Label>
              <Select value={formData.children} onValueChange={(value) => setFormData({ ...formData, children: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="infants">Bebés (0-2)</Label>
              <Select value={formData.infants} onValueChange={(value) => setFormData({ ...formData, infants: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Tipo de Habitación</Label>
            <Select value={formData.roomTypeId} onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo de habitación" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((roomType: any) => (
                  <SelectItem key={roomType.id} value={String(roomType.id)}>
                    {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ratePlan" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Plan de Tarifas
            </Label>
            <Select value={formData.ratePlanId} onValueChange={(value) => setFormData({ ...formData, ratePlanId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione plan de tarifa" />
              </SelectTrigger>
              <SelectContent>
                {ratePlans.map((plan: any) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>
                    {plan.name} {plan.modifier_type === "percentage" && plan.modifier_value ? `(-${plan.modifier_value}%)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pricePreview && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Vista Previa del Precio</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{pricePreview.nights} {pricePreview.nights === 1 ? "noche" : "noches"}:</span>
                  <span>RD${pricePreview.basePrice.toFixed(2)}</span>
                </div>
                {pricePreview.ratePlanDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento plan de tarifas:</span>
                    <span>-RD${pricePreview.ratePlanDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>RD${pricePreview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS (18%):</span>
                  <span>RD${pricePreview.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total:</span>
                  <span>RD${pricePreview.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: (809) 555-1234"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-ocean"
            disabled={createReservationMutation.isPending}
          >
            {createReservationMutation.isPending ? "Creando..." : "Crear Reserva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReservationDialog;
