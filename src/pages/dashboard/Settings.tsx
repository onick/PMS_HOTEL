import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelSettings } from "@/components/settings/HotelSettings";
import { RoomTypesSettings } from "@/components/settings/RoomTypesSettings";
import { RoomsSettings } from "@/components/settings/RoomsSettings";
import { Building2, BedDouble, DoorOpen } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la información y configuración de tu hotel
        </p>
      </div>

      <Tabs defaultValue="hotel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
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
      </Tabs>
    </div>
  );
}
