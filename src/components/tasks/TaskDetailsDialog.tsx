import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Calendar, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskDetailsDialogProps {
  task: any;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailsDialog({ task, open, onClose }: TaskDetailsDialogProps) {
  const [newComment, setNewComment] = useState("");

  // TODO: Wire up when backend task comments endpoint is available
  const comments: any[] = [];

  if (!task) return null;

  const priorityColors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };

  const statusColors: Record<string, string> = {
    PENDING: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {task.title}
          </DialogTitle>
          <DialogDescription>
            Detalles y comentarios de la tarea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
            <Badge variant={statusColors[task.status as keyof typeof statusColors] as any}>
              {task.status}
            </Badge>
            {task.rooms && (
              <Badge variant="outline">Habitación {task.rooms.room_number}</Badge>
            )}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm">{task.description}</p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-muted-foreground">
              {task.assigned_to_user?.profiles?.full_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Asignado: {task.assigned_to_user.profiles.full_name}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Vence: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: es })}</span>
                </div>
              )}
              {task.created_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Creado: {format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Comentarios ({comments.length})</h4>

            <ScrollArea className="h-[200px] pr-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No hay comentarios aún
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <p className="text-sm mb-2">{comment.comment}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {comment.profiles?.full_name || "Usuario"}
                        </span>
                        <span>
                          {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="space-y-2">
              <Textarea
                placeholder="Agregar un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={() => {
                  toast.info("Comentarios próximamente disponibles");
                  setNewComment("");
                }}
                disabled={!newComment}
                size="sm"
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar Comentario
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
