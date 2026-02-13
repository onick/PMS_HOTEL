import { Suspense, lazy } from "react";
import TodayArrivals from "@/components/front-desk/TodayArrivals";
import TodayDepartures from "@/components/front-desk/TodayDepartures";
import InHouseGuests from "@/components/front-desk/InHouseGuests";
import RoomStatusGrid from "@/components/front-desk/RoomStatusGrid";

const NewReservationDialog = lazy(() => import("@/components/reservations/NewReservationDialog"));
const WalkInDialog = lazy(() => import("@/components/front-desk/WalkInDialog"));

export default function FrontDesk() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Front Desk</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestión de check-in, check-out y asignación de habitaciones
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Suspense fallback={null}>
            <WalkInDialog />
          </Suspense>
          <Suspense fallback={null}>
            <NewReservationDialog />
          </Suspense>
        </div>
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
