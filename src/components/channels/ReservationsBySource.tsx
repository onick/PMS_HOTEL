import { useChannelStats } from "@/hooks/useChannels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const CHANNEL_COLORS: Record<string, string> = {
    DIRECT: "bg-emerald-500",
    BOOKING_COM: "bg-blue-600",
    EXPEDIA: "bg-yellow-500",
    AIRBNB: "bg-rose-500",
    HOSTELWORLD: "bg-orange-500",
    HOTELS_COM: "bg-red-600",
    TRIPADVISOR: "bg-green-600",
};

export default function ReservationsBySource() {
    const { data: stats, isLoading } = useChannelStats();
    const sources = stats?.reservations_by_source_30d ?? [];

    const totalCount = sources.reduce((sum, s) => sum + s.count, 0);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Cargando datos de revenue...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Reservas por Fuente (30 días)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sources.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        No hay datos de reservas en los últimos 30 días
                    </p>
                ) : (
                    <div className="space-y-5">
                        {/* Stacked bar */}
                        <div className="h-8 w-full rounded-full overflow-hidden flex bg-muted/40">
                            {sources.map((source) => {
                                const pct = totalCount > 0 ? (source.count / totalCount) * 100 : 0;
                                if (pct < 1) return null;
                                return (
                                    <div
                                        key={source.source}
                                        className={`${CHANNEL_COLORS[source.source] ?? "bg-gray-400"} transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                        title={`${source.label}: ${source.count} (${pct.toFixed(0)}%)`}
                                    />
                                );
                            })}
                        </div>

                        {/* Legend + values */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sources.map((source) => {
                                const pct = totalCount > 0 ? ((source.count / totalCount) * 100).toFixed(1) : '0';
                                return (
                                    <div
                                        key={source.source}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${CHANNEL_COLORS[source.source] ?? "bg-gray-400"}`}
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{source.label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {source.count} reservas · {pct}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{source.revenue}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
