import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

interface GuestsListProps {
  onSelectGuest: (guest: any) => void;
}

export default function GuestsList({ onSelectGuest }: GuestsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: guestsData, isLoading } = useQuery({
    queryKey: ["guests-list", searchTerm],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      // Get active reservations with guest info
      let query = supabase
        .from("reservations")
        .select(`
          id,
          check_in,
          check_out,
          customer,
          room_types(name),
          folio_id,
          folios(balance_cents, currency)
        `)
        .eq("hotel_id", userRoles.hotel_id)
        .in("status", ["CONFIRMED", "CHECKED_IN"])
        .order("check_in", { ascending: true });

      if (searchTerm) {
        query = query.or(`customer->>name.ilike.%${searchTerm}%,customer->>email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "DOP",
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Guest List ({guestsData?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading guests...</p>
          ) : !guestsData?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "No guests found" : "No active reservations"}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Guest Name</TableHead>
                    <TableHead className="min-w-[110px]">Check In</TableHead>
                    <TableHead className="min-w-[110px]">Check Out</TableHead>
                    <TableHead className="min-w-[130px]">Room Type</TableHead>
                    <TableHead className="min-w-[120px]">Allocated Room</TableHead>
                    <TableHead className="text-right min-w-[120px]">Due Amount</TableHead>
                    <TableHead className="min-w-[110px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestsData.map((reservation: any) => (
                    <TableRow key={reservation.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium py-4">
                        {reservation.customer?.name || "N/A"}
                      </TableCell>
                      <TableCell className="py-4">
                        {formatDate(reservation.check_in)}
                      </TableCell>
                      <TableCell className="py-4">
                        {formatDate(reservation.check_out)}
                      </TableCell>
                      <TableCell className="py-4">
                        {reservation.room_types?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4">
                        TBD
                      </TableCell>
                      <TableCell className="text-right font-medium py-4 pr-6">
                        {reservation.folios?.[0] 
                          ? formatCurrency(reservation.folios[0].balance_cents, reservation.folios[0].currency)
                          : "$0.00"}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={
                          reservation.status === 'CHECKED_IN' ? 'default' :
                          reservation.status === 'CONFIRMED' ? 'secondary' :
                          'outline'
                        }>
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onSelectGuest({
                              id: reservation.id,
                              name: reservation.customer?.name,
                              email: reservation.customer?.email,
                              phone: reservation.customer?.phone,
                            })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
