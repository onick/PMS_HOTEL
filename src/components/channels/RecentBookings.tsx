import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Directo",
  BOOKING: "Booking.com",
  EXPEDIA: "Expedia",
  AIRBNB: "Airbnb",
  WALKIN: "Walk-in",
  PHONE: "Teléfono",
};

const sourceIcons: Record<string, string> = {
  BOOKING: "🏨",
  AIRBNB: "🏠",
  EXPEDIA: "✈️",
  DIRECT: "💼",
  WALKIN: "🚶",
  PHONE: "📞",
};

export default function RecentBookings() {
  const { data: bookings } = useQuery({
    queryKey: ["channel-bookings"],
    queryFn: async () => {
      const res = await api.getReservations({ per_page: "15" });
      return (res.data || []) as any[];
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
                const source = booking.source || "DIRECT";
                const channelIcon = sourceIcons[source] || "💼";
                const channelName = SOURCE_LABELS[source] || source;

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
                              {booking.guest?.full_name || "Huésped"}
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
                          {booking.units?.[0]?.room_type?.name || "N/A"}
                        </p>
                        <p>{booking.adults || 1} huéspedes</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">
                          ${(booking.total_cents / 100).toFixed(2)}
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
