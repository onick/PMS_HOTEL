import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Star, Mail, Phone, Eye } from "lucide-react";

interface GuestsListProps {
  onSelectGuest: (guest: any) => void;
}

export default function GuestsList({ onSelectGuest }: GuestsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: guests } = useQuery({
    queryKey: ["guests", searchTerm],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      let query = supabase
        .from("guests")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .order("last_stay_date", { ascending: false, nullsFirst: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-crm">
          <Users className="h-5 w-5" />
          Base de Datos de Huéspedes ({guests?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[600px] pr-4">
            {!guests?.length ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? "No se encontraron huéspedes" : "No hay huéspedes registrados"}
              </p>
            ) : (
              <div className="space-y-3">
                {guests.map((guest: any) => (
                  <div
                    key={guest.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onSelectGuest(guest)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{guest.name}</h4>
                          {guest.vip_status && (
                            <Badge className="bg-crm">
                              <Star className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <div>
                        <p className="font-medium text-foreground">{guest.total_stays}</p>
                        <p>Estadías</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          ${((guest.total_spent_cents || 0) / 100).toFixed(0)}
                        </p>
                        <p>Gastado</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {guest.last_stay_date ? new Date(guest.last_stay_date).toLocaleDateString() : "N/A"}
                        </p>
                        <p>Última visita</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
