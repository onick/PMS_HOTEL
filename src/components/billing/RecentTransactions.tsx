import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function RecentTransactions() {
  const { data: transactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data: charges, error } = await supabase
        .from("folio_charges")
        .select(`
          *,
          folios (
            currency,
            reservations (
              customer
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return charges || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-billing">
          <History className="h-5 w-5" />
          Transacciones Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {!transactions?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No hay transacciones registradas
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction: any) => {
                const amount = transaction.amount_cents / 100;
                const isPayment = amount < 0;
                const customerName = transaction.folios?.reservations?.[0]?.customer?.name || "Huésped";

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${isPayment ? "bg-success/10" : "bg-billing/10"}`}>
                        {isPayment ? (
                          <TrendingDown className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-billing" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.charge_date || transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isPayment ? "text-success" : "text-foreground"}`}>
                        {isPayment ? "" : "+"}${amount.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.folios?.currency || "USD"}
                      </p>
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
