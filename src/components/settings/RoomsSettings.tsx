import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Maximize2, Bed, Users, DoorOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoomsSettings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

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
            id,
            name,
            description,
            base_price_cents,
            base_occupancy,
            max_occupancy
          )
        `)
        .eq("hotel_id", userRole.hotel_id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Group rooms by type
  const roomsByType = rooms?.reduce((acc: any, room: any) => {
    const typeName = room.room_types?.name || "Sin tipo";
    if (!acc[typeName]) {
      acc[typeName] = {
        type: room.room_types,
        rooms: [],
      };
    }
    acc[typeName].rooms.push(room);
    return acc;
  }, {});

  // Filter rooms
  const filteredRoomsByType = roomsByType ? Object.entries(roomsByType).filter(([typeName, data]: any) => {
    const matchesSearch = typeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || typeName === filterType;
    return matchesSearch && matchesType;
  }) : [];

  const statusConfig = {
    AVAILABLE: { label: "Disponible", variant: "default" as const, color: "bg-green-500/10 text-green-600" },
    OCCUPIED: { label: "Ocupada", variant: "destructive" as const, color: "bg-red-500/10 text-red-600" },
    CLEANING: { label: "Limpieza", variant: "secondary" as const, color: "bg-blue-500/10 text-blue-600" },
    MAINTENANCE: { label: "Mantenimiento", variant: "outline" as const, color: "bg-orange-500/10 text-orange-600" },
    OUT_OF_SERVICE: { label: "Fuera de servicio", variant: "outline" as const, color: "bg-gray-500/10 text-gray-600" },
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const getAvailableRooms = (rooms: any[]) => {
    return rooms.filter((r: any) => r.status === "AVAILABLE").length;
  };

  const getOccupiedRooms = (rooms: any[]) => {
    return rooms.filter((r: any) => r.status === "OCCUPIED").length;
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
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipo de habitación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {roomsByType && Object.keys(roomsByType).map((typeName) => (
                  <SelectItem key={typeName} value={typeName}>
                    {typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoomsByType.map(([typeName, data]: any) => {
          const { type, rooms: typeRooms } = data;
          const available = getAvailableRooms(typeRooms);
          const occupied = getOccupiedRooms(typeRooms);
          const total = typeRooms.length;

          return (
            <Card key={typeName} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4 p-6">
                {/* Placeholder Image */}
                <div className="w-full sm:w-48 h-48 bg-gradient-ocean rounded-lg flex items-center justify-center flex-shrink-0">
                  <DoorOpen className="h-16 w-16 text-white/50" />
                </div>

                {/* Room Type Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{typeName}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Maximize2 className="h-4 w-4" />
                          <span>35m²</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>King Size</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{type?.max_occupancy || 2} huéspedes</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={available > 0 ? statusConfig.AVAILABLE.color : statusConfig.OCCUPIED.color}
                    >
                      {available > 0 ? "Disponible" : "Ocupado"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {type?.description || "Espacio cómodo y elegante con cama tamaño queen, baño privado, Smart TV, minibar y Wi-Fi de cortesía."}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Disponibilidad</p>
                      <p className="font-semibold text-foreground">
                        {available}/{total}
                        <span className="text-xs text-muted-foreground ml-1">habitaciones</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Precio base</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(type?.base_price_cents || 0)}
                        <span className="text-xs text-muted-foreground font-normal">/noche</span>
                      </p>
                    </div>
                  </div>

                  {/* Room Numbers */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Habitaciones:</p>
                    <div className="flex flex-wrap gap-2">
                      {typeRooms.slice(0, 8).map((room: any) => (
                        <Button
                          key={room.id}
                          variant="outline"
                          size="sm"
                          className={`h-8 px-3 ${
                            room.status === "OCCUPIED" 
                              ? "bg-destructive/10 text-destructive border-destructive/20" 
                              : "bg-primary/5 border-primary/20"
                          }`}
                          onClick={() => setSelectedRoom(room)}
                        >
                          {room.room_number}
                        </Button>
                      ))}
                      {typeRooms.length > 8 && (
                        <span className="h-8 px-3 flex items-center text-xs text-muted-foreground">
                          +{typeRooms.length - 8} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRoomsByType.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron habitaciones" : "No hay habitaciones configuradas"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
