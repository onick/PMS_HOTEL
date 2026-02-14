import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Activity,
  Settings2,
  BarChart3,
} from "lucide-react";
import { useSyncAllChannels } from "@/hooks/useChannels";
import ChannelStats from "@/components/channels/ChannelStats";
import ChannelsList from "@/components/channels/ChannelsList";
import SyncLogsTable from "@/components/channels/SyncLogsTable";
import ReservationsBySource from "@/components/channels/ReservationsBySource";

export default function Channels() {
  const [activeTab, setActiveTab] = useState("overview");
  const syncAll = useSyncAllChannels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Manager</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de canales OTA, sincronización y mappings
          </p>
        </div>

        <Button
          onClick={() => syncAll.mutate()}
          disabled={syncAll.isPending}
          className="bg-revenue hover:bg-revenue/90 text-white shadow-md"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncAll.isPending ? "animate-spin" : ""}`} />
          {syncAll.isPending ? "Sincronizando..." : "Sync All"}
        </Button>
      </div>

      {/* Stats Cards */}
      <ChannelStats />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Canales
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sync Logs
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ChannelsList />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <SyncLogsTable />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <ReservationsBySource />
        </TabsContent>
      </Tabs>
    </div>
  );
}
