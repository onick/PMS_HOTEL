import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function InHouseGuests() {
  const { data: inHouse } = useQuery({
    queryKey: ["in-house-guests"],
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
        .eq("status", "CHECKED_IN")
        .order("check_out", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-front-desk">
          <Hotel className="h-5 w-5" />
          Huéspedes en Casa ({inHouse?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inHouse?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay huéspedes actualmente en el hotel
          </p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {inHouse.map((reservation: any) => {
              const roomNumber = reservation.metadata?.room_number;
              const nightsRemaining = Math.ceil(
                (new Date(reservation.check_out).getTime() - new Date().getTime()) / 
                (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={reservation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{reservation.customer.name}</span>
                    </div>
                    <Badge className="bg-front-desk">
                      Hab. {roomNumber || "N/A"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{reservation.room_types?.name}</p>
                      <p>{reservation.guests} huéspedes</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3" />
                        Salida: {formatDate(reservation.check_out)}
                      </p>
                      <p className={nightsRemaining <= 1 ? "text-warning font-medium" : ""}>
                        {nightsRemaining} {nightsRemaining === 1 ? "noche" : "noches"} restantes
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
