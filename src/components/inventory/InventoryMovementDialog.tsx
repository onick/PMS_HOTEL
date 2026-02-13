import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface InventoryMovementDialogProps {
  item: any;
  open: boolean;
  onClose: () => void;
}

export function InventoryMovementDialog({ item, open, onClose }: InventoryMovementDialogProps) {
  const queryClient = useQueryClient();
  const [movement, setMovement] = useState({
    movement_type: "PURCHASE",
    quantity: 0,
    notes: "",
  });

  const movementMutation = useMutation({
    mutationFn: async (data: typeof movement) => {
      // Calculate the signed quantity based on movement type
      let signedQuantity = data.quantity;
      if (["USAGE", "WASTE", "TRANSFER"].includes(data.movement_type)) {
        signedQuantity = -Math.abs(data.quantity);
      }

      return api.createInventoryMovement(item.id, {
        movement_type: data.movement_type,
        quantity: signedQuantity,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Movimiento registrado correctamente");
      onClose();
      setMovement({
        movement_type: "PURCHASE",
        quantity: 0,
        notes: "",
      });
    },
    onError: () => {
      toast.error("Error al registrar movimiento");
    },
  });

  const movementTypes = [
    { value: "PURCHASE", label: "Compra", icon: "+" },
    { value: "USAGE", label: "Uso", icon: "-" },
    { value: "ADJUSTMENT", label: "Ajuste", icon: "±" },
    { value: "TRANSFER", label: "Transferencia", icon: "→" },
    { value: "WASTE", label: "Desperdicio", icon: "-" },
  ];

  const isSubtraction = ["USAGE", "WASTE", "TRANSFER"].includes(movement.movement_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
          <DialogDescription>
            {item?.name} - Stock actual: {item?.current_stock} {item?.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo de Movimiento</Label>
            <Select
              value={movement.movement_type}
              onValueChange={(value) => setMovement({ ...movement, movement_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cantidad</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  min="0"
                  value={movement.quantity}
                  onChange={(e) => setMovement({ ...movement, quantity: parseInt(e.target.value) || 0 })}
                  className={isSubtraction ? "border-red-300" : "border-green-300"}
                />
                <span className="absolute right-3 top-3 text-xs text-muted-foreground">
                  {item?.unit}
                </span>
              </div>
              <div className={`w-20 flex items-center justify-center border rounded ${
                isSubtraction ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              }`}>
                <span className="font-bold text-lg">
                  {isSubtraction ? "-" : "+"}{movement.quantity}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nuevo stock: {item?.current_stock + (isSubtraction ? -movement.quantity : movement.quantity)} {item?.unit}
            </p>
          </div>

          <div>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={movement.notes}
              onChange={(e) => setMovement({ ...movement, notes: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => movementMutation.mutate(movement)}
              disabled={movement.quantity <= 0 || movementMutation.isPending}
              className="flex-1"
            >
              Registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
