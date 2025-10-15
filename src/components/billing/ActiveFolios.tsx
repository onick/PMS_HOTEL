import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, User, DollarSign } from "lucide-react";
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
            room_types (name)
          )
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .gt("balance_cents", 0)
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
            No hay folios con balance pendiente
          </p>
        ) : (
          <div className="space-y-3">
            {folios.map((folio: any) => {
              const reservation = folio.reservations?.[0];
              const balance = folio.balance_cents / 100;

              return (
                <div
                  key={folio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectFolio(folio)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {reservation?.customer?.name || "Huésped"}
                      </span>
                      <Badge variant="outline">
                        {reservation?.room_types?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {formatDate(reservation?.check_in)} - {formatDate(reservation?.check_out)}
                      </span>
                      <span>Estado: {reservation?.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-destructive">
                      <DollarSign className="h-4 w-4" />
                      {balance.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">{folio.currency}</p>
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
