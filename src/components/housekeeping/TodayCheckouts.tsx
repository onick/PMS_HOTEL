import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

export default function TodayCheckouts() {
  const { data: checkouts } = useQuery({
    queryKey: ["housekeeping-checkouts"],
    queryFn: async () => {
      const res = await api.getReservations({
        check_out_date: new Date().toISOString().split("T")[0],
        status: "CHECKED_IN",
      });
      return (res.data || []) as any[];
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
          <div className="text-center py-8 space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <LogOut className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium">No hay salidas hoy</p>
              <p className="text-sm text-muted-foreground">
                No hay check-outs programados para hoy
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {checkouts.map((reservation: any) => {
              const roomNumber = reservation.units?.[0]?.room?.number;
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
                        {reservation.guest?.full_name || "Huésped"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Hab. {roomNumber || "N/A"}</span>
                      <span>{reservation.units?.[0]?.room_type?.name}</span>
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
