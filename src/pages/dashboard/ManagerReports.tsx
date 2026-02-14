import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    AlertTriangle,
    CreditCard,
    Hotel,
} from 'lucide-react';
import { ReportFilterBar } from '@/components/manager/ReportFilterBar';
import { PaymentsDonut } from '@/components/manager/PaymentsDonut';
import {
    useOccupancyReport,
    useAdrReport,
    useRevparReport,
    useRevenueReport,
    useNoShowReport,
    usePaymentDistribution,
} from '@/hooks/useReports';
import { api } from '@/lib/api';
import { formatCurrencyAmount, formatCurrencyFromCents, normalizeCurrencyCode } from '@/lib/currency';

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}
function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}
function fmtMoney(cents: number, currencyCode: string): string {
    return formatCurrencyFromCents(cents, currencyCode);
}

// ─── Stat Box ───────────────────────────────────────────────
function StatBox({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
    return (
        <div className={`p-3 rounded-lg border text-center ${accent ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border/30'}`}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
        </div>
    );
}

// ─── No Data ────────────────────────────────────────────────
function NoData() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No hay datos para este período</p>
            <p className="text-xs mt-1">Los datos se generan durante el night audit</p>
        </div>
    );
}

// ─── Tab: Occupancy ─────────────────────────────────────────
function OccupancyTab({ from, to }: { from: string; to: string }) {
    const { data, isLoading } = useOccupancyReport(from, to);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data || !data.daily.length) return <NoData />;

    const chartData = data.daily.filter(d => d.occupancy_rate !== null).map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        occupancy: d.occupancy_rate,
        occupied: d.occupied_rooms,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="Promedio" value={`${data.summary.avg_occupancy_rate}%`} accent />
                <StatBox label="Pico" value={`${data.summary.peak_occupancy_rate}%`} />
                <StatBox label="Mínimo" value={`${data.summary.lowest_occupancy_rate}%`} />
                <StatBox label="Días con datos" value={data.summary.days_with_data} />
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Ocupación']} />
                    <Line type="monotone" dataKey="occupancy" stroke="#818cf8" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Tab: ADR ───────────────────────────────────────────────
function AdrTab({ from, to, currencyCode }: { from: string; to: string; currencyCode: string }) {
    const { data, isLoading } = useAdrReport(from, to);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data || !data.daily.length) return <NoData />;

    const chartData = data.daily.map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        adr: d.adr_cents / 100,
        rooms: d.occupied_rooms,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatBox label="Promedio ADR" value={formatCurrencyAmount(Number(data.summary.avg_adr), currencyCode)} accent />
                <StatBox label="Máximo" value={fmtMoney(data.summary.max_adr_cents, currencyCode)} />
                <StatBox label="Mínimo" value={fmtMoney(data.summary.min_adr_cents, currencyCode)} />
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCurrencyAmount(v as number, currencyCode, 'es-DO', { maximumFractionDigits: 0 })} />
                    <Tooltip formatter={(v: number) => [formatCurrencyAmount(v, currencyCode), 'ADR']} />
                    <Bar dataKey="adr" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Tab: RevPAR ────────────────────────────────────────────
function RevparTab({ from, to, currencyCode }: { from: string; to: string; currencyCode: string }) {
    const { data, isLoading } = useRevparReport(from, to);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data || !data.daily.length) return <NoData />;

    const chartData = data.daily.map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        revpar: d.revpar_cents / 100,
        occupancy: d.occupancy_rate,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatBox label="Promedio RevPAR" value={formatCurrencyAmount(Number(data.summary.avg_revpar), currencyCode)} accent />
                <StatBox label="Máximo" value={fmtMoney(data.summary.max_revpar_cents, currencyCode)} />
                <StatBox label="Mínimo" value={fmtMoney(data.summary.min_revpar_cents, currencyCode)} />
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCurrencyAmount(v as number, currencyCode, 'es-DO', { maximumFractionDigits: 0 })} />
                    <Tooltip formatter={(v: number) => [formatCurrencyAmount(v, currencyCode), 'RevPAR']} />
                    <Legend />
                    <Line type="monotone" dataKey="revpar" stroke="#10b981" strokeWidth={2} dot={false} name="RevPAR" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Tab: Revenue ───────────────────────────────────────────
function RevenueTab({ from, to, currencyCode }: { from: string; to: string; currencyCode: string }) {
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
    const { data, isLoading } = useRevenueReport(from, to, granularity);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data || !data.data.length) return <NoData />;

    const chartData = data.data.map(d => ({
        name: d.label,
        room: d.room_revenue_cents / 100,
        other: d.other_revenue_cents / 100,
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {(['day', 'week', 'month'] as const).map(g => (
                    <button
                        key={g}
                        onClick={() => setGranularity(g)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${granularity === g
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}
                    >
                        {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatBox label="Total Revenue" value={formatCurrencyAmount(Number(data.summary.total_revenue), currencyCode)} accent />
                <StatBox label="Room Revenue" value={formatCurrencyAmount(Number(data.summary.total_room_revenue), currencyCode)} />
                <StatBox label="Otros Ingresos" value={formatCurrencyAmount(Number(data.summary.total_other_revenue), currencyCode)} />
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCurrencyAmount(v as number, currencyCode, 'es-DO', { notation: 'compact', maximumFractionDigits: 1 })} />
                    <Tooltip formatter={(v: number) => [formatCurrencyAmount(v, currencyCode), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="room" name="Habitaciones" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="other" name="Otros" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Tab: No-Shows ──────────────────────────────────────────
function NoShowTab({ from, to, currencyCode }: { from: string; to: string; currencyCode: string }) {
    const { data, isLoading } = useNoShowReport(from, to);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data) return <NoData />;

    const chartData = data.daily.filter(d => d.no_shows > 0).map(d => ({
        date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        noShows: d.no_shows,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="Total No-Shows" value={data.summary.total_no_shows} accent />
                <StatBox label="Llegadas Esperadas" value={data.summary.total_expected_arrivals} />
                <StatBox label="Rate" value={`${data.summary.no_show_rate}%`} />
                <StatBox label="Revenue Perdido" value={formatCurrencyAmount(Number(data.summary.lost_revenue), currencyCode)} />
            </div>

            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="noShows" name="No-Shows" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    ✅ Sin no-shows en este período
                </div>
            )}

            {/* No-show reservation list */}
            {data.no_show_reservations.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold mb-2 text-foreground">Reservas No-Show</h3>
                    <div className="space-y-2">
                        {data.no_show_reservations.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30">
                                <div>
                                    <p className="text-sm font-medium">{r.confirmation_code}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {r.guest?.name || 'Sin huésped'} • {r.check_in_date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-red-400">{formatCurrencyAmount(Number(r.total), currencyCode)}</p>
                                    <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Payments ──────────────────────────────────────────
function PaymentsTab({ from, to, currencyCode }: { from: string; to: string; currencyCode: string }) {
    const { data, isLoading } = usePaymentDistribution(from, to);
    if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
    if (!data) return <NoData />;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="Total Pagos" value={data.summary.total_payments} accent />
                <StatBox label="Monto Total" value={formatCurrencyAmount(Number(data.summary.total_amount), currencyCode)} />
                <StatBox label="Reembolsos" value={data.summary.refunds_count} />
                <StatBox label="Net Revenue" value={fmtMoney(data.summary.net_revenue_cents, currencyCode)} />
            </div>

            <PaymentsDonut data={data.by_provider} />
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ManagerReports() {
    const [from, setFrom] = useState(daysAgo(30));
    const [to, setTo] = useState(todayStr());
    const { data: hotelData } = useQuery({
        queryKey: ['hotel-currency'],
        queryFn: async () => (await api.getHotel()).data,
    });
    const currencyCode = normalizeCurrencyCode(hotelData?.currency);

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Reportes & Analítica
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Análisis detallado de KPIs del hotel
                </p>
            </div>

            <ReportFilterBar
                from={from}
                to={to}
                onFromChange={setFrom}
                onToChange={setTo}
            />

            <Tabs defaultValue="occupancy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="occupancy" className="text-xs gap-1 py-2">
                        <Hotel className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Ocupación</span>
                    </TabsTrigger>
                    <TabsTrigger value="adr" className="text-xs gap-1 py-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">ADR</span>
                    </TabsTrigger>
                    <TabsTrigger value="revpar" className="text-xs gap-1 py-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">RevPAR</span>
                    </TabsTrigger>
                    <TabsTrigger value="revenue" className="text-xs gap-1 py-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Revenue</span>
                    </TabsTrigger>
                    <TabsTrigger value="noshows" className="text-xs gap-1 py-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">No-Shows</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs gap-1 py-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Pagos</span>
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="pt-6">
                        <TabsContent value="occupancy"><OccupancyTab from={from} to={to} /></TabsContent>
                        <TabsContent value="adr"><AdrTab from={from} to={to} currencyCode={currencyCode} /></TabsContent>
                        <TabsContent value="revpar"><RevparTab from={from} to={to} currencyCode={currencyCode} /></TabsContent>
                        <TabsContent value="revenue"><RevenueTab from={from} to={to} currencyCode={currencyCode} /></TabsContent>
                        <TabsContent value="noshows"><NoShowTab from={from} to={to} currencyCode={currencyCode} /></TabsContent>
                        <TabsContent value="payments"><PaymentsTab from={from} to={to} currencyCode={currencyCode} /></TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
