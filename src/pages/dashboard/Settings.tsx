import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelSettings } from "@/components/settings/HotelSettings";
import { RoomTypesSettings } from "@/components/settings/RoomTypesSettings";
import { RoomsSettings } from "@/components/settings/RoomsSettings";
import { RatePlansSettings } from "@/components/settings/RatePlansSettings";
import { PromoCodesSettings } from "@/components/settings/PromoCodesSettings";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { Building2, BedDouble, DoorOpen, Percent, Tag, CreditCard } from "lucide-react";

export default function Settings() {
  // Get hotel_id from user
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la información y configuración de tu hotel
        </p>
      </div>

      <Tabs defaultValue="hotel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="hotel" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hotel</span>
          </TabsTrigger>
          <TabsTrigger value="room-types" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            <span className="hidden sm:inline">Tipos</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Habitaciones</span>
          </TabsTrigger>
          <TabsTrigger value="rate-plans" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Tarifas</span>
          </TabsTrigger>
          <TabsTrigger value="promo-codes" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Promos</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Suscripción</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotel" className="space-y-4">
          <HotelSettings />
        </TabsContent>

        <TabsContent value="room-types" className="space-y-4">
          <RoomTypesSettings />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <RoomsSettings />
        </TabsContent>

        <TabsContent value="rate-plans" className="space-y-4">
          <RatePlansSettings />
        </TabsContent>

        <TabsContent value="promo-codes" className="space-y-4">
          <PromoCodesSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          {userRoles?.hotel_id && (
            <SubscriptionPlans hotelId={userRoles.hotel_id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
