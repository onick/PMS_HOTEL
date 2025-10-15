import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function TodayCheckouts() {
  const today = new Date().toISOString().split("T")[0];

  const { data: checkouts } = useQuery({
    queryKey: ["housekeeping-checkouts"],
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
        .eq("check_out", today)
        .in("status", ["CHECKED_IN", "CHECKED_OUT"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-housekeeping">
          <LogOut className="h-5 w-5" />
          Check-outs de Hoy ({checkouts?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!checkouts?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay check-outs programados para hoy
          </p>
        ) : (
          <div className="space-y-3">
            {checkouts.map((reservation: any) => {
              const roomNumber = reservation.metadata?.room_number;
              const isCheckedOut = reservation.status === "CHECKED_OUT";

              return (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {reservation.customer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Hab. {roomNumber || "N/A"}</span>
                      <span>{reservation.room_types?.name}</span>
                    </div>
                  </div>
                  <Badge
                    variant={isCheckedOut ? "default" : "secondary"}
                    className={isCheckedOut ? "bg-warning" : ""}
                  >
                    {isCheckedOut ? "Requiere limpieza" : "En casa"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
