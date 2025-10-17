import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const NewReservationDialog = ({ hotelId }: { hotelId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    adults: "2",
    children: "0",
    infants: "0",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    roomTypeId: "",
    ratePlanId: "c4444444-4444-4444-4444-444444444444", // BAR (default)
    promoCode: "",
  });
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

  // Fetch rate plans
  const { data: ratePlans } = useQuery({
    queryKey: ["rate-plans", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_plans")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch room types for price calculation
  const { data: roomTypes } = useQuery({
    queryKey: ["room-types", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Validate promo code
  const validatePromoCode = async () => {
    if (!formData.promoCode.trim()) {
      toast.error("Por favor ingrese un código promocional");
      return;
    }

    setPromoValidating(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", formData.promoCode.toUpperCase())
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Código promocional no válido");
        setPromoDiscount(0);
        setPromoApplied(false);
        return;
      }

      // Validate dates
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        toast.error("Este código aún no está activo");
        setPromoDiscount(0);
        setPromoApplied(false);
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        toast.error("Este código ha expirado");
        setPromoDiscount(0);
        setPromoApplied(false);
        return;
      }

      // Validate minimum nights
      if (data.min_nights && formData.checkIn && formData.checkOut) {
        const nights = Math.ceil(
          (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        if (nights < data.min_nights) {
          toast.error(`Este código requiere mínimo ${data.min_nights} noches`);
          setPromoDiscount(0);
          setPromoApplied(false);
          return;
        }
      }

      // Check max uses
      if (data.max_uses && data.times_used >= data.max_uses) {
        toast.error("Este código ha alcanzado su límite de usos");
        setPromoDiscount(0);
        setPromoApplied(false);
        return;
      }

      // Apply discount
      const discount = data.discount_type === "percentage" 
        ? data.discount_value 
        : data.discount_value;
      
      setPromoDiscount(discount);
      setPromoApplied(true);
      toast.success(`¡Código aplicado! ${data.discount_type === "percentage" ? `${discount}% de descuento` : `RD$${discount.toFixed(2)} de descuento`}`);
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      toast.error("Error al validar código promocional");
      setPromoDiscount(0);
      setPromoApplied(false);
    } finally {
      setPromoValidating(false);
    }
  };

  // Calculate price preview
  const calculatePrice = () => {
    if (!formData.checkIn || !formData.checkOut || !formData.roomTypeId || !roomTypes) {
      return null;
    }

    const roomType = roomTypes.find(rt => rt.id === formData.roomTypeId);
    if (!roomType) return null;

    const nights = Math.ceil(
      (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    // Base price
    const basePrice = (roomType.base_price_cents / 100) * nights;

    // Rate plan discount
    const selectedRatePlan = ratePlans?.find(rp => rp.id === formData.ratePlanId);
    const ratePlanDiscount = selectedRatePlan?.discount_percentage 
      ? (basePrice * selectedRatePlan.discount_percentage) / 100 
      : 0;

    const priceAfterRatePlan = basePrice - ratePlanDiscount;

    // Promo code discount
    let promoCodeDiscount = 0;
    if (promoApplied && promoDiscount > 0) {
      // For now assuming percentage, could be extended for fixed amount
      promoCodeDiscount = (priceAfterRatePlan * promoDiscount) / 100;
    }

    const priceAfterPromo = priceAfterRatePlan - promoCodeDiscount;

    // Tax (ITBIS 18%)
    const tax = priceAfterPromo * 0.18;

    const total = priceAfterPromo + tax;

    return {
      basePrice,
      nights,
      ratePlanDiscount,
      promoCodeDiscount,
      subtotal: priceAfterPromo,
      tax,
      total,
    };
  };

  const pricePreview = calculatePrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);

      if (checkInDate >= checkOutDate) {
        toast.error("La fecha de check-out debe ser posterior a la fecha de check-in");
        setLoading(false);
        return;
      }

      const idempotencyKey = uuidv4();

      const requestBody = {
        idempotencyKey,
        hotelId,
        roomTypeId: formData.roomTypeId || "b2222222-2222-2222-2222-222222222222",
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
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
        ratePlanId: formData.ratePlanId,
        promoCode: promoApplied ? formData.promoCode : undefined,
        currency: "DOP",
        payment: {
          strategy: "pay_at_hotel",
        },
      };

      console.log("Creating reservation with data:", requestBody);

      // Get auth session for authorization header
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Make direct fetch to get full error response
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-reservation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseData = await response.json();
      console.log("Create reservation response:", { status: response.status, data: responseData });

      if (!response.ok) {
        const errorMessage = responseData.error || "Error al crear reserva";
        console.error("Function returned error:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = responseData;

      toast.success("Reserva creada exitosamente");
      setOpen(false);
      setFormData({
        checkIn: "",
        checkOut: "",
        adults: "2",
        children: "0",
        infants: "0",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        roomTypeId: "",
        ratePlanId: "c4444444-4444-4444-4444-444444444444",
        promoCode: "",
      });
      setPromoDiscount(0);
      setPromoApplied(false);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error(error.message || "Error al crear reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-ocean hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
                min={new Date().toISOString().split('T')[0]}
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
                min={formData.checkIn || new Date().toISOString().split('T')[0]}
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
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
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
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
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
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
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
                {roomTypes?.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.id}>
                    {roomType.name} - RD${(roomType.base_price_cents / 100).toFixed(2)}/noche
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ratePlans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} {plan.discount_percentage > 0 && `(-${plan.discount_percentage}%)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoCode" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Código Promocional (Opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="promoCode"
                placeholder="Ingrese código"
                value={formData.promoCode}
                onChange={(e) => {
                  setFormData({ ...formData, promoCode: e.target.value.toUpperCase() });
                  setPromoApplied(false);
                }}
                className={promoApplied ? "border-green-500" : ""}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validatePromoCode}
                disabled={promoValidating || !formData.promoCode.trim()}
              >
                {promoValidating ? "..." : promoApplied ? "✓" : "Aplicar"}
              </Button>
            </div>
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
                {pricePreview.promoCodeDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento código promo:</span>
                    <span>-RD${pricePreview.promoCodeDiscount.toFixed(2)}</span>
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

          <div className="space-y-2">
            <Label htmlFor="customerName">Nombre del Cliente</Label>
            <Input
              id="customerName"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email del Cliente</Label>
            <Input
              id="customerEmail"
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Teléfono del Cliente</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="Ej: (809) 555-1234"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-ocean" disabled={loading}>
            {loading ? "Creando..." : "Crear Reserva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReservationDialog;