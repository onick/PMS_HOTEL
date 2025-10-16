import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export function RoomTypesSettings() {
  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ["room-types-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();

      if (!userRole) throw new Error("No hotel assigned");

      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", userRole.hotel_id)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Habitaciones</CardTitle>
        <CardDescription>
          Visualiza los tipos de habitaciones disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nombre</TableHead>
                <TableHead className="min-w-[200px]">Descripción</TableHead>
                <TableHead className="min-w-[120px]">Precio Base</TableHead>
                <TableHead className="min-w-[120px]">Ocupación Base</TableHead>
                <TableHead className="min-w-[120px]">Ocupación Máx.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes && roomTypes.length > 0 ? (
                roomTypes.map((type: any) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium py-4">{type.name}</TableCell>
                    <TableCell className="py-4">{type.description || "N/A"}</TableCell>
                    <TableCell className="py-4">{formatCurrency(type.base_price_cents)}</TableCell>
                    <TableCell className="py-4">{type.base_occupancy}</TableCell>
                    <TableCell className="py-4">{type.max_occupancy}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay tipos de habitaciones configurados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
