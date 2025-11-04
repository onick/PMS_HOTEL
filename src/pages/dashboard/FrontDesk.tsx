import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TodayArrivals from "@/components/front-desk/TodayArrivals";
import TodayDepartures from "@/components/front-desk/TodayDepartures";
import InHouseGuests from "@/components/front-desk/InHouseGuests";
import RoomStatusGrid from "@/components/front-desk/RoomStatusGrid";
import NewReservationDialog from "@/components/reservations/NewReservationDialog";
import WalkInDialog from "@/components/front-desk/WalkInDialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Front Desk</h1>
          <p className="text-muted-foreground">
            Gestión de check-in, check-out y asignación de habitaciones
          </p>
        </div>
        {userRoles?.hotel_id && (
          <div className="flex gap-2">
            <PermissionGuard module="front-desk" action="create" hotelId={userRoles.hotel_id}>
              <WalkInDialog hotelId={userRoles.hotel_id} />
            </PermissionGuard>
            <PermissionGuard module="reservations" action="create" hotelId={userRoles.hotel_id}>
              <NewReservationDialog hotelId={userRoles.hotel_id} />
            </PermissionGuard>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayArrivals />
        <TodayDepartures />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InHouseGuests />
        <RoomStatusGrid />
      </div>
    </div>
  );
}
