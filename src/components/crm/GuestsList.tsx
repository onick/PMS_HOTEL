import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      const params: Record<string, string> = {
        per_page: String(ITEMS_PER_PAGE),
        page: String(currentPage),
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      return api.getGuests(params);
    },
  });

  const guestsData = guestsResponse?.data || [];
  const totalCount = guestsResponse?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Huéspedes ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <GuestsListSkeleton />
          ) : !guestsData?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "No se encontraron huéspedes" : "No hay huéspedes registrados"}
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nombre</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[120px]">Teléfono</TableHead>
                    <TableHead className="min-w-[80px]">Estadías</TableHead>
                    <TableHead className="text-right min-w-[120px]">Total Gastado</TableHead>
                    <TableHead className="min-w-[80px]">VIP</TableHead>
                    <TableHead className="text-right min-w-[80px]">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestsData.map((guest: any) => (
                    <TableRow key={guest.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium py-4">
                        {guest.full_name || `${guest.first_name} ${guest.last_name}`}
                      </TableCell>
                      <TableCell className="py-4">
                        {guest.email || "—"}
                      </TableCell>
                      <TableCell className="py-4">
                        {guest.phone || "—"}
                      </TableCell>
                      <TableCell className="py-4">
                        {guest.total_stays || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium py-4 pr-6">
                        ${guest.total_spent || "0.00"}
                      </TableCell>
                      <TableCell className="py-4">
                        {guest.vip_level ? (
                          <Badge variant="default" className="bg-crm">
                            VIP {guest.vip_level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectGuest(guest)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} huéspedes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
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
                  Siguiente
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
