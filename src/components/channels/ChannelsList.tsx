import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings2,
  Trash2,
  Plus,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChannels,
  useConnectChannel,
  useDeleteChannel,
  useSyncChannel,
  useValidateChannel,
} from "@/hooks/useChannels";
import ConnectChannelDialog from "./ConnectChannelDialog";
import ChannelMappingsDialog from "./ChannelMappingsDialog";
import ChannelOutboxViewer from "./ChannelOutboxViewer";
import type { ChannelConnectionData } from "@/lib/api";

const CHANNEL_META: Record<string, { logo: string; label: string; color: string }> = {
  BOOKING_COM: { logo: "🏨", label: "Booking.com", color: "bg-blue-600" },
  EXPEDIA: { logo: "✈️", label: "Expedia", color: "bg-yellow-500" },
  AIRBNB: { logo: "🏠", label: "Airbnb", color: "bg-rose-500" },
  HOSTELWORLD: { logo: "🎒", label: "Hostelworld", color: "bg-orange-500" },
  HOTELS_COM: { logo: "🌟", label: "Hotels.com", color: "bg-red-600" },
  TRIPADVISOR: { logo: "🦉", label: "TripAdvisor", color: "bg-green-600" },
};

// Available channels that can be connected
const AVAILABLE_CHANNELS = Object.entries(CHANNEL_META).map(([id, meta]) => ({
  id,
  ...meta,
}));

export default function ChannelsList() {
  const { data: connections, isLoading } = useChannels();
  const connectMutation = useConnectChannel();
  const deleteMutation = useDeleteChannel();
  const syncMutation = useSyncChannel();
  const validateMutation = useValidateChannel();

  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [mappingsDialog, setMappingsDialog] = useState<ChannelConnectionData | null>(null);
  const [outboxDialog, setOutboxDialog] = useState<ChannelConnectionData | null>(null);

  const connectedChannelCodes = new Set(connections?.map((c) => c.channel) ?? []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            Canales de Distribución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Connected channels */}
            {connections?.map((conn) => {
              const meta = CHANNEL_META[conn.channel] ?? {
                logo: "🌐",
                label: conn.channel,
                color: "bg-gray-500",
              };
              const isActive = conn.status === "ACTIVE";
              const mappingCount =
                (conn.room_type_mappings?.length ?? 0) +
                (conn.rate_plan_mappings?.length ?? 0);

              return (
                <div
                  key={conn.id}
                  className={`p-4 border rounded-xl space-y-3 transition-all hover:shadow-md ${isActive
                      ? "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10"
                      : "border-red-200 bg-red-50/20 dark:bg-red-950/10"
                    }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.logo}</span>
                      <div>
                        <h3 className="font-semibold">{meta.label}</h3>
                        <Badge
                          variant={isActive ? "default" : "destructive"}
                          className={`text-xs ${isActive ? "bg-emerald-500" : ""}`}
                        >
                          {isActive ? (
                            <><Wifi className="h-3 w-3 mr-1" /> Activo</>
                          ) : (
                            <><WifiOff className="h-3 w-3 mr-1" /> {conn.status}</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {mappingCount > 0 ? (
                        <span>{mappingCount} mappings configurados</span>
                      ) : (
                        <span className="text-amber-600">Sin mappings</span>
                      )}
                    </div>
                    {conn.last_sync_at && (
                      <p>
                        Último sync:{" "}
                        {new Date(conn.last_sync_at).toLocaleString("es-DO", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {conn.last_error && (
                      <p className="text-red-500 truncate" title={conn.last_error}>
                        ⚠ {conn.last_error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setMappingsDialog(conn)}
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Mappings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate({ id: conn.id })}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`h-3 w-3 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => validateMutation.mutate(conn.id)}
                      disabled={validateMutation.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`¿Desconectar ${meta.label}?`)) {
                          deleteMutation.mutate(conn.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Outbox link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => setOutboxDialog(conn)}
                  >
                    Ver outbox →
                  </Button>
                </div>
              );
            })}

            {/* Available (unconnected) channels */}
            {AVAILABLE_CHANNELS.filter((ch) => !connectedChannelCodes.has(ch.id)).map(
              (channel) => (
                <div
                  key={channel.id}
                  className="p-4 border border-dashed rounded-xl space-y-3 hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">
                      {channel.logo}
                    </span>
                    <div>
                      <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {channel.label}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        <WifiOff className="h-3 w-3 mr-1" /> No conectado
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => setConnectDialog(channel.id)}
                    disabled={connectMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Conectar
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConnectChannelDialog
        channelCode={connectDialog}
        channelMeta={connectDialog ? CHANNEL_META[connectDialog] : null}
        open={!!connectDialog}
        onClose={() => setConnectDialog(null)}
      />

      {mappingsDialog && (
        <ChannelMappingsDialog
          connection={mappingsDialog}
          open={!!mappingsDialog}
          onClose={() => setMappingsDialog(null)}
        />
      )}

      {outboxDialog && (
        <ChannelOutboxViewer
          connection={outboxDialog}
          open={!!outboxDialog}
          onClose={() => setOutboxDialog(null)}
        />
      )}
    </>
  );
}
