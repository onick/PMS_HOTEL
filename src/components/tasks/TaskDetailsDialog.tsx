import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch comments for this task
  const { data: comments } = useQuery({
    queryKey: ["task-comments", task?.id],
    enabled: !!task?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately to avoid PostgREST join issues
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c: any) => c.user_id))];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        // Manual mapping
        return data.map((comment: any) => ({
          ...comment,
          profiles: profiles?.find((p) => p.id === comment.user_id)
        }));
      }

      return data;
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: task.id,
          user_id: user.id,
          comment,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", task.id] });
      toast.success("Comentario agregado");
      setNewComment("");
    },
    onError: () => {
      toast.error("Error al agregar comentario");
    },
  });

  if (!task) return null;

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };

  const statusColors = {
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
          {/* Task Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
            <Badge variant={statusColors[task.status as keyof typeof statusColors] as any}>
              {task.status}
            </Badge>
            {task.rooms && (
              <Badge variant="outline">
                Habitación {task.rooms.room_number}
              </Badge>
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
              {task.created_by_user?.profiles?.full_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Creado por: {task.created_by_user.profiles.full_name}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Vence: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: es })}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Creado: {format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Comentarios ({comments?.length || 0})</h4>

            <ScrollArea className="h-[200px] pr-4">
              {!comments?.length ? (
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

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Agregar un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={() => newComment && addCommentMutation.mutate(newComment)}
                disabled={!newComment || addCommentMutation.isPending}
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
