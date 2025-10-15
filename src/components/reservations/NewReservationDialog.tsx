import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const NewReservationDialog = ({ hotelId }: { hotelId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
    customerName: "",
    customerEmail: "",
    roomTypeId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const idempotencyKey = uuidv4();

      const { data, error } = await supabase.functions.invoke("create-reservation", {
        body: {
          idempotencyKey,
          hotelId,
          roomTypeId: formData.roomTypeId || "b2222222-2222-2222-2222-222222222222",
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          guests: parseInt(formData.guests),
          customer: {
            name: formData.customerName,
            email: formData.customerEmail,
          },
          ratePlanId: "c4444444-4444-4444-4444-444444444444",
          currency: "DOP",
          payment: {
            strategy: "pay_at_hotel",
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Reserva creada exitosamente");
      setOpen(false);
      setFormData({
        checkIn: "",
        checkOut: "",
        guests: "2",
        customerName: "",
        customerEmail: "",
        roomTypeId: "",
      });
    } catch (error: any) {
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                required
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
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Huéspedes</Label>
            <Select value={formData.guests} onValueChange={(value) => setFormData({ ...formData, guests: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 huésped</SelectItem>
                <SelectItem value="2">2 huéspedes</SelectItem>
                <SelectItem value="3">3 huéspedes</SelectItem>
                <SelectItem value="4">4 huéspedes</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <Button type="submit" className="w-full bg-gradient-ocean" disabled={loading}>
            {loading ? "Creando..." : "Crear Reserva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReservationDialog;