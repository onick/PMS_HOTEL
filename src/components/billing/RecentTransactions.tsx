import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function RecentTransactions() {
  // Fetch recent folios with charges loaded to display transactions
  const { data: folios } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const res = await api.getFolios({ per_page: "10", include_charges: "1" });
      return res.data || [];
    },
  });

  // Flatten charges from all folios and sort by date
  const transactions = (folios || [])
    .flatMap((folio: any) =>
      (folio.charges || []).map((charge: any) => ({
        ...charge,
        folio_currency: folio.currency,
        guest_name: folio.reservation?.guest?.full_name || "Huésped",
      }))
    )
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  // If no charges from folios list, try to get individual folio details
  // For now, show what we have from the folios list endpoint

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
                        <p className="text-sm text-muted-foreground">{transaction.guest_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.charge_date || transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isPayment ? "text-success" : "text-foreground"}`}>
                        {isPayment ? "" : "+"}${Math.abs(amount).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.folio_currency || "DOP"}
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
