import TodayArrivals from "@/components/front-desk/TodayArrivals";
import TodayDepartures from "@/components/front-desk/TodayDepartures";
import InHouseGuests from "@/components/front-desk/InHouseGuests";
import RoomStatus from "@/components/front-desk/RoomStatus";

export default function FrontDesk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Front Desk</h1>
        <p className="text-muted-foreground">
          Gestión de check-in, check-out y asignación de habitaciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayArrivals />
        <TodayDepartures />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InHouseGuests />
        <RoomStatus />
      </div>
    </div>
  );
}
