import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, User, Phone, UserCog } from "lucide-react";

interface AddStaffDialogProps {
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
}

export function AddStaffDialog({ open, onClose, onInvited }: AddStaffDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "RECEPTION",
  });

  const roleOptions = [
    { value: "MANAGER", label: "Manager" },
    { value: "RECEPTION", label: "Recepción" },
    { value: "HOUSEKEEPING", label: "Limpieza" },
    { value: "SALES", label: "Ventas" },
  ];

  const inviteMutation = useMutation({
    mutationFn: () => api.inviteStaff(formData),
    onSuccess: () => {
      toast.success("Invitación enviada correctamente");
      onClose();
      onInvited?.();
      setFormData({ email: "", full_name: "", phone: "", role: "RECEPTION" });
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo enviar la invitación");
    },
  });

  const handleSubmit = () => {
    inviteMutation.mutate();
  };

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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.email || !formData.full_name || inviteMutation.isPending}
              className="flex-1"
            >
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Invitación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
