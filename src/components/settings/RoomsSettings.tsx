import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function RoomsSettings() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms-settings"],
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
        .from("rooms")
        .select(`
          *,
          room_types (
            name
          )
        `)
        .eq("hotel_id", userRole.hotel_id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const statusConfig = {
    AVAILABLE: { label: "Disponible", variant: "default" as const },
    OCCUPIED: { label: "Ocupada", variant: "destructive" as const },
    CLEANING: { label: "Limpieza", variant: "secondary" as const },
    MAINTENANCE: { label: "Mantenimiento", variant: "outline" as const },
    OUT_OF_SERVICE: { label: "Fuera de servicio", variant: "outline" as const },
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
        <CardTitle>Habitaciones</CardTitle>
        <CardDescription>
          Visualiza todas las habitaciones del hotel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Número</TableHead>
                <TableHead className="min-w-[80px]">Piso</TableHead>
                <TableHead className="min-w-[150px]">Tipo</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms && rooms.length > 0 ? (
                rooms.map((room: any) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium py-4">{room.room_number}</TableCell>
                    <TableCell className="py-4">{room.floor || "N/A"}</TableCell>
                    <TableCell className="py-4">{room.room_types?.name || "N/A"}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant={statusConfig[room.status as keyof typeof statusConfig]?.variant || "outline"}>
                        {statusConfig[room.status as keyof typeof statusConfig]?.label || room.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay habitaciones configuradas
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
