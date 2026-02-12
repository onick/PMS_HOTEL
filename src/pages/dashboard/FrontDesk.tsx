import { Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TodayArrivals from "@/components/front-desk/TodayArrivals";
import TodayDepartures from "@/components/front-desk/TodayDepartures";
import InHouseGuests from "@/components/front-desk/InHouseGuests";
import RoomStatusGrid from "@/components/front-desk/RoomStatusGrid";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const NewReservationDialog = lazy(() => import("@/components/reservations/NewReservationDialog"));
const WalkInDialog = lazy(() => import("@/components/front-desk/WalkInDialog"));

export default function FrontDesk() {
  // Get hotel_id from user
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Front Desk</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestión de check-in, check-out y asignación de habitaciones
          </p>
        </div>
        {userRoles?.hotel_id && (
          <div className="flex gap-2 w-full sm:w-auto">
            <PermissionGuard module="front-desk" action="create" hotelId={userRoles.hotel_id}>
              <Suspense fallback={null}>
                <WalkInDialog hotelId={userRoles.hotel_id} />
              </Suspense>
            </PermissionGuard>
            <PermissionGuard module="reservations" action="create" hotelId={userRoles.hotel_id}>
              <Suspense fallback={null}>
                <NewReservationDialog hotelId={userRoles.hotel_id} />
              </Suspense>
            </PermissionGuard>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userRoles?.hotel_id && <TodayArrivals hotelId={userRoles.hotel_id} />}
        {userRoles?.hotel_id && <TodayDepartures hotelId={userRoles.hotel_id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userRoles?.hotel_id && <InHouseGuests hotelId={userRoles.hotel_id} />}
        {userRoles?.hotel_id && <RoomStatusGrid hotelId={userRoles.hotel_id} />}
      </div>
    </div>
  );
}
