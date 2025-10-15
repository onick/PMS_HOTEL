import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationsList } from "./NotificationsList";

interface NotificationBellProps {
  hotelId: string;
}

export function NotificationBell({ hotelId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Obtener notificaciones no leídas
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotelId)
        .eq("read", false);

      if (error) throw error;
      return data?.length || 0;
    },
  });

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          // Refrescar contador cuando hay cambios
          queryClient.invalidateQueries({ queryKey: ["notifications-unread", hotelId] });
          queryClient.invalidateQueries({ queryKey: ["notifications", hotelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, queryClient]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationsList hotelId={hotelId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
