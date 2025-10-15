import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

const channelIcons: Record<string, string> = {
  booking: "🏨",
  airbnb: "🏠",
  expedia: "✈️",
  direct: "💼",
};

export default function RecentBookings() {
  const { data: bookings } = useQuery({
    queryKey: ["channel-bookings"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types (name)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-channel-manager">
          <Activity className="h-5 w-5" />
          Reservas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {!bookings?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No hay reservas recientes
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking: any) => {
                const metadata = booking.metadata && typeof booking.metadata === 'object' ? booking.metadata : {};
                const channel = (metadata as any).channel || "direct";
                const channelIcon = channelIcons[channel] || "💼";
                const channelName = channel === "direct" ? "Directo" : 
                  channel.charAt(0).toUpperCase() + channel.slice(1);

                return (
                  <div
                    key={booking.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{channelIcon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {booking.customer?.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {channelName}
                          </Badge>
                        </div>
                      </div>
                      <Badge
                        variant={
                          booking.status === "CONFIRMED" ? "default" :
                          booking.status === "CHECKED_IN" ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">
                          {booking.room_types?.name}
                        </p>
                        <p>{booking.guests} huéspedes</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">
                          ${(booking.total_amount_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
