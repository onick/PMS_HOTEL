import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, User, DollarSign, Home } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

interface ActiveFoliosProps {
  onSelectFolio: (folio: any) => void;
}

export default function ActiveFolios({ onSelectFolio }: ActiveFoliosProps) {
  const { data: folios } = useQuery({
    queryKey: ["active-folios"],
    queryFn: async () => {
      const res = await api.getFolios({ status: "open", per_page: "50" });
      return res.data || [];
    },
  });

  const formatCurrency = (cents: number, currency?: string) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "DOP",
    }).format(cents / 100);
  };

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
            No hay folios activos
          </p>
        ) : (
          <div className="space-y-3">
            {folios.map((folio: any) => {
              const reservation = folio.reservation;
              const guestName = reservation?.guest?.full_name || "Huésped";
              const roomNumber = reservation?.units?.[0]?.room?.number || "Sin asignar";
              const roomTypeName = reservation?.units?.[0]?.room_type?.name;

              return (
                <div
                  key={folio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectFolio(folio)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{guestName}</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        Hab. {roomNumber}
                      </Badge>
                      {roomTypeName && (
                        <Badge variant="secondary">{roomTypeName}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {formatDate(reservation?.check_in_date)} - {formatDate(reservation?.check_out_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <DollarSign className="h-4 w-4" />
                      <span className={folio.balance_cents > 0 ? "text-destructive" : folio.balance_cents < 0 ? "text-success" : ""}>
                        {formatCurrency(Math.abs(folio.balance_cents), folio.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {folio.balance_cents > 0 ? "Pendiente" : folio.balance_cents < 0 ? "A favor" : "Pagado"} · {folio.currency}
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
