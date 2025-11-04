import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, User, Phone, UserCog } from "lucide-react";

interface AddStaffDialogProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
}

export function AddStaffDialog({ open, onClose, hotelId }: AddStaffDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "STAFF",
  });

  const inviteStaffMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // Check if there's already a pending invitation
      const { data: existingInvite } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("email", data.email)
        .eq("status", "PENDING")
        .maybeSingle();

      if (existingInvite) {
        throw new Error("Ya existe una invitación pendiente para este email");
      }

      // Create invitation
      const { data: newInvitation, error } = await supabase
        .from("staff_invitations")
        .insert({
          hotel_id: hotelId,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email via Edge Function
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
          `${supabase.supabaseUrl}/functions/v1/send-staff-invitation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              invitation_id: newInvitation.id,
            }),
          }
        );

        if (!response.ok) {
          console.error("Failed to send invitation email");
          // Don't throw error - invitation was created successfully
        }
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Don't throw error - invitation was created successfully
      }

      return newInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invitations"] });
      toast.success("Invitación enviada correctamente");
      onClose();
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        role: "STAFF",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar invitación");
    },
  });

  const roleOptions = [
    { value: "MANAGER", label: "Manager" },
    { value: "RECEPTION", label: "Recepción" },
    { value: "HOUSEKEEPING", label: "Limpieza" },
    { value: "MAINTENANCE", label: "Mantenimiento" },
    { value: "STAFF", label: "Personal" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Agregar Personal
          </DialogTitle>
          <DialogDescription>
            Envía una invitación para que el nuevo empleado se registre en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="empleado@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                placeholder="Juan Pérez"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => inviteStaffMutation.mutate(formData)}
              disabled={!formData.email || !formData.full_name || inviteStaffMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              Enviar Invitación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
