import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, User, DollarSign, Home } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

interface ActiveFoliosProps {
  onSelectFolio: (folio: any) => void;
}

export default function ActiveFolios({ onSelectFolio }: ActiveFoliosProps) {
  const { data: folios } = useQuery({
    queryKey: ["active-folios"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data, error } = await supabase
        .from("folios")
        .select(`
          *,
          reservations (
            id,
            customer,
            check_in,
            check_out,
            status,
            room_id,
            room_types (name),
            rooms (room_number)
          )
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .eq("reservations.status", "CHECKED_IN")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-billing">
          <Receipt className="h-5 w-5" />
          Folios Activos ({folios?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!folios?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No hay huéspedes actualmente en el hotel
          </p>
        ) : (
          <div className="space-y-3">
            {folios.map((folio: any) => {
              const reservation = folio.reservations?.[0];
              const balance = folio.balance_cents / 100;
              const roomNumber = reservation?.rooms?.room_number || "Sin asignar";

              return (
                <div
                  key={folio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectFolio(folio)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {reservation?.customer?.name || "Huésped"}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        Hab. {roomNumber}
                      </Badge>
                      <Badge variant="secondary">
                        {reservation?.room_types?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {formatDate(reservation?.check_in)} - {formatDate(reservation?.check_out)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <DollarSign className="h-4 w-4" />
                      <span className={balance > 0 ? "text-destructive" : balance < 0 ? "text-success" : ""}>
                        {Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {balance > 0 ? "Pendiente" : balance < 0 ? "A favor" : "Pagado"} • {folio.currency}
                    </p>
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
