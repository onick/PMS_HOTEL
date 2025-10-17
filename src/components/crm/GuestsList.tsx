import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { GuestsListSkeleton } from "@/components/ui/skeletons/GuestsSkeleton";

interface GuestsListProps {
  onSelectGuest: (guest: any) => void;
}

const ITEMS_PER_PAGE = 10;

export default function GuestsList({ onSelectGuest }: GuestsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: guestsResponse, isLoading } = useQuery({
    queryKey: ["guests-list", searchTerm, currentPage],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return { data: [], count: 0 };

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Get active reservations with guest info
      let query = supabase
        .from("reservations")
        .select(`
          id,
          check_in,
          check_out,
          customer,
          status,
          guests,
          metadata,
          room_id,
          room_types(name),
          rooms(room_number, floor),
          folio_id,
          folios(balance_cents, currency)
        `, { count: 'exact' })
        .eq("hotel_id", userRoles.hotel_id)
        .in("status", ["CONFIRMED", "CHECKED_IN"])
        .order("check_in", { ascending: true })
        .range(from, to);

      if (searchTerm) {
        query = query.or(`customer->>name.ilike.%${searchTerm}%,customer->>email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });

  const guestsData = guestsResponse?.data || [];
  const totalCount = guestsResponse?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency || "DOP",
    }).format(cents / 100);
  };

  const formatGuestBreakdown = (reservation: any) => {
    const breakdown = reservation.metadata?.guestBreakdown;
    if (!breakdown) {
      return `${reservation.guests || 0} huéspedes`;
    }

    const parts = [];
    if (breakdown.adults > 0) parts.push(`${breakdown.adults} adulto${breakdown.adults > 1 ? 's' : ''}`);
    if (breakdown.children > 0) parts.push(`${breakdown.children} niño${breakdown.children > 1 ? 's' : ''}`);
    if (breakdown.infants > 0) parts.push(`${breakdown.infants} bebé${breakdown.infants > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : `${reservation.guests} huéspedes`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Guest List ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <GuestsListSkeleton />
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
                    <TableHead className="min-w-[160px]">Guests</TableHead>
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
                      <TableCell className="py-4">
                        {formatGuestBreakdown(reservation)}
                      </TableCell>
                      <TableCell className="py-4">
                        {reservation.rooms ? (
                          <span className="font-medium">
                            {reservation.rooms.room_number}
                            {reservation.rooms.floor && <span className="text-muted-foreground text-sm ml-1">(Piso {reservation.rooms.floor})</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">TBD</span>
                        )}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} guests
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
