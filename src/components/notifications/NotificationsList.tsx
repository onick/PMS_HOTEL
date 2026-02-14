import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  BedDouble,
  User,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationsListProps {
  onClose: () => void;
}

interface Notification {
  id: number;
  title: string;
  message?: string;
  body?: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "checkout":
      return <BedDouble className="h-4 w-4" />;
    case "incident":
      return <AlertCircle className="h-4 w-4" />;
    case "assignment":
      return <User className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "checkout":
      return "text-blue-500";
    case "incident":
      return "text-orange-500";
    case "assignment":
      return "text-green-500";
    default:
      return "text-muted-foreground";
  }
};

export function NotificationsList({ onClose }: NotificationsListProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.getNotifications({ per_page: "20" });
      return (res.data || []) as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return api.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return api.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Cargando notificaciones...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {unreadCount} sin leer
          </p>
        )}
      </div>

      {/* List */}
      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const isRead = !!notification.read_at;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors group",
                    !isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("mt-1", getNotificationColor(notification.type))}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              !isRead && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message || notification.body || ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
