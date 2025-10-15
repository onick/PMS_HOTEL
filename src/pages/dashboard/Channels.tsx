import ChannelStats from "@/components/channels/ChannelStats";
import ChannelsList from "@/components/channels/ChannelsList";
import InventorySync from "@/components/channels/InventorySync";
import RecentBookings from "@/components/channels/RecentBookings";

export default function Channels() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Channel Manager</h1>
        <p className="text-muted-foreground">
          Gestión de canales de distribución y OTAs
        </p>
      </div>

      <ChannelStats />

      <ChannelsList />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventorySync />
        <RecentBookings />
      </div>
    </div>
  );
}
