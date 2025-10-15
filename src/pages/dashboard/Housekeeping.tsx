import DailyStats from "@/components/housekeeping/DailyStats";
import RoomsByStatus from "@/components/housekeeping/RoomsByStatus";
import TodayCheckouts from "@/components/housekeeping/TodayCheckouts";
import CleaningPriority from "@/components/housekeeping/CleaningPriority";

export default function Housekeeping() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Housekeeping</h1>
        <p className="text-muted-foreground">
          Control de limpieza y mantenimiento de habitaciones
        </p>
      </div>

      <DailyStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayCheckouts />
        <CleaningPriority />
      </div>

      <RoomsByStatus />
    </div>
  );
}
