import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import {
    LayoutDashboard,
    Plane,
    LogOut,
    Hotel,
    DollarSign,
    CreditCard,
    TrendingUp,
    BarChart3,
    Activity,
    Eye,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/manager/KpiCard';
import { TrendChip } from '@/components/manager/TrendChip';
import { SparklineChart } from '@/components/manager/SparklineChart';
import { PaymentsDonut } from '@/components/manager/PaymentsDonut';
import { ReportFilterBar } from '@/components/manager/ReportFilterBar';
import {
    useManagerDashboard,
    useRevenueReport,
    usePaymentDistribution,
} from '@/hooks/useReports';
import type { ManagerDashboardData } from '@/lib/api';

// ─── Demo Data (used when API is not connected) ────────────
const DEMO_DATA: ManagerDashboardData = {
    generated_at: new Date().toISOString(),
    today: {
        date: new Date().toISOString().split('T')[0],
        arrivals_pending: 8,
        departures_pending: 5,
        in_house: 34,
        revenue_cents: 452000,
        revenue: '4,520.00',
        payments_count: 12,
    },
    kpis_30d: {
        avg_occupancy_rate: 72.4,
        avg_adr_cents: 145000,
        avg_adr: '1,450.00',
        avg_revpar_cents: 104980,
        avg_revpar: '1,049.80',
        total_revenue_cents: 89040000,
        total_revenue: '890,400.00',
        total_no_shows: 3,
        days_with_data: 30,
    },
    kpis_7d: {
        avg_occupancy_rate: 78.2,
        avg_adr_cents: 152000,
        avg_adr: '1,520.00',
        total_revenue_cents: 22600000,
        total_revenue: '226,000.00',
    },
    trends: {
        occupancy_direction: 'up',
        adr_direction: 'up',
        revenue_direction: 'up',
    },
    sparkline: Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d.toISOString().split('T')[0],
            occupancy: 55 + Math.random() * 35,
            revenue_cents: 200000 + Math.random() * 300000,
        };
    }),
};

const DEMO_PAYMENTS = {
    period: { from: '', to: '' },
    summary: {
        total_payments: 147,
        total_amount_cents: 89040000,
        total_amount: '890,400.00',
        avg_payment_cents: 605714,
        refunds_count: 4,
        refunds_total_cents: 320000,
        net_revenue_cents: 88720000,
    },
    by_provider: [
        { provider: 'CASH', count: 62, amount_cents: 37650000, amount: '376,500.00', percentage_amount: 42.3, percentage_count: 42.2 },
        { provider: 'CARD_TERMINAL', count: 51, amount_cents: 31250000, amount: '312,500.00', percentage_amount: 35.1, percentage_count: 34.7 },
        { provider: 'STRIPE', count: 22, amount_cents: 16560000, amount: '165,600.00', percentage_amount: 18.6, percentage_count: 15.0 },
        { provider: 'TRANSFER', count: 12, amount_cents: 3580000, amount: '35,800.00', percentage_amount: 4.0, percentage_count: 8.2 },
    ],
    daily: [],
};

const DEMO_REVENUE = {
    period: { from: '', to: '' },
    granularity: 'day',
    summary: {
        total_room_revenue_cents: 78000000,
        total_room_revenue: '780,000.00',
        total_other_revenue_cents: 11040000,
        total_other_revenue: '110,400.00',
        total_revenue_cents: 89040000,
        total_revenue: '890,400.00',
        avg_daily_revenue_cents: 2968000,
    },
    data: Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const room = 2000000 + Math.random() * 1500000;
        const other = 200000 + Math.random() * 200000;
        return {
            period: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('es', { month: 'short', day: 'numeric' }),
            room_revenue_cents: Math.round(room),
            room_revenue: (room / 100).toFixed(2),
            other_revenue_cents: Math.round(other),
            other_revenue: (other / 100).toFixed(2),
            total_revenue_cents: Math.round(room + other),
            total_revenue: ((room + other) / 100).toFixed(2),
            days_in_period: 1,
        };
    }),
};

// ─── Helper ──────────────────────────────────────────────────
function formatMoney(cents: number): string {
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ManagerDashboard() {
    const [revenueFrom, setRevenueFrom] = useState(daysAgo(30));
    const [revenueTo, setRevenueTo] = useState(todayStr());
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

    // API calls (with fallback to demo data)
    const { data: dashboardData, isLoading: dashLoading, refetch } = useManagerDashboard();
    const { data: revenueData } = useRevenueReport(revenueFrom, revenueTo, granularity);
    const { data: paymentData } = usePaymentDistribution(revenueFrom, revenueTo);

    // Use API data or fall back to demo
    const dash = dashboardData || DEMO_DATA;
    const payments = paymentData || DEMO_PAYMENTS;
    const revenue = revenueData || DEMO_REVENUE;
    const isDemo = !dashboardData;

    // Chart data for revenue
    const revenueChartData = useMemo(() => {
        return revenue.data.map((d) => ({
            name: d.label,
            room: d.room_revenue_cents / 100,
            other: d.other_revenue_cents / 100,
            total: d.total_revenue_cents / 100,
        }));
    }, [revenue]);

    // Sparkline data
    const occupancySparkline = useMemo(() => {
        return dash.sparkline.map((s) => ({
            date: new Date(s.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
            value: Math.round(s.occupancy),
        }));
    }, [dash]);

    const revenueSparkline = useMemo(() => {
        return dash.sparkline.map((s) => ({
            date: new Date(s.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
            value: s.revenue_cents / 100,
        }));
    }, [dash]);

    return (
        <div className="space-y-6 pb-8">
            {/* ─── Header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                        Dashboard del Gerente
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Última actualización: {new Date(dash.generated_at).toLocaleString('es')}
                        {isDemo && (
                            <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/30 text-amber-500">
                                Datos Demo
                            </Badge>
                        )}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-1.5"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Actualizar
                </Button>
            </div>

            {/* ─── Section 1: Today Cards ──────────────────────────── */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Hoy — {new Date(dash.today.date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <KpiCard
                        title="Llegadas"
                        value={dash.today.arrivals_pending}
                        subtitle="pendientes de check-in"
                        icon={Plane}
                        variant="default"
                    />
                    <KpiCard
                        title="Salidas"
                        value={dash.today.departures_pending}
                        subtitle="pendientes de check-out"
                        icon={LogOut}
                        variant="default"
                    />
                    <KpiCard
                        title="In-House"
                        value={dash.today.in_house}
                        subtitle="huéspedes alojados"
                        icon={Hotel}
                        variant="occupancy"
                    />
                    <KpiCard
                        title="Revenue Hoy"
                        value={`$${dash.today.revenue}`}
                        subtitle={`${dash.today.payments_count} pagos`}
                        icon={DollarSign}
                        variant="revenue"
                    />
                    <KpiCard
                        title="Pagos"
                        value={dash.today.payments_count}
                        subtitle="transacciones hoy"
                        icon={CreditCard}
                        variant="default"
                    />
                </div>
            </div>

            {/* ─── Section 2: KPIs 7d vs 30d ──────────────────────── */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    KPIs — Últimos 7d vs 30d
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <KpiCard
                        title="Ocupación"
                        value={`${dash.kpis_7d.avg_occupancy_rate}%`}
                        trend={dash.trends.occupancy_direction}
                        trendLabel={`${Math.abs(dash.kpis_7d.avg_occupancy_rate - dash.kpis_30d.avg_occupancy_rate).toFixed(1)}pp`}
                        comparison={`${dash.kpis_30d.avg_occupancy_rate}%`}
                        icon={Eye}
                        variant="occupancy"
                    />
                    <KpiCard
                        title="ADR"
                        value={`$${dash.kpis_7d.avg_adr}`}
                        trend={dash.trends.adr_direction}
                        comparison={`$${dash.kpis_30d.avg_adr}`}
                        icon={TrendingUp}
                        variant="highlight"
                    />
                    <KpiCard
                        title="RevPAR"
                        value={`$${dash.kpis_30d.avg_revpar}`}
                        subtitle="30 días promedio"
                        icon={BarChart3}
                        variant="default"
                    />
                    <KpiCard
                        title="Revenue 7d"
                        value={formatMoney(dash.kpis_7d.total_revenue_cents)}
                        trend={dash.trends.revenue_direction}
                        comparison={formatMoney(dash.kpis_30d.total_revenue_cents) + ' (30d)'}
                        icon={DollarSign}
                        variant="revenue"
                    />
                    <KpiCard
                        title="No-Shows"
                        value={dash.kpis_30d.total_no_shows}
                        subtitle="últimos 30 días"
                        icon={AlertTriangle}
                        variant={dash.kpis_30d.total_no_shows > 5 ? 'default' : 'default'}
                    />
                </div>
            </div>

            {/* ─── Section 3: Trend Chips ──────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Tendencias 7d:</span>
                <TrendChip direction={dash.trends.occupancy_direction} label="Ocupación" />
                <TrendChip direction={dash.trends.adr_direction} label="ADR" />
                <TrendChip direction={dash.trends.revenue_direction} label="Revenue" />
            </div>

            {/* ─── Section 4: Sparklines ───────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ocupación — Últimos 30 días
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SparklineChart
                            data={occupancySparkline}
                            color="#818cf8"
                            gradientId="occupancyGrad"
                            height={80}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Revenue — Últimos 30 días
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SparklineChart
                            data={revenueSparkline}
                            color="#10b981"
                            gradientId="revenueGrad"
                            height={80}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* ─── Section 5: Revenue Chart ────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            Desglose de Revenue
                        </CardTitle>
                        <ReportFilterBar
                            from={revenueFrom}
                            to={revenueTo}
                            onFromChange={setRevenueFrom}
                            onToChange={setRevenueTo}
                            granularity={granularity}
                            onGranularityChange={setGranularity}
                            showGranularity
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Room Revenue</p>
                            <p className="text-lg font-bold text-emerald-500">${revenue.summary.total_room_revenue}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Otros Ingresos</p>
                            <p className="text-lg font-bold text-blue-500">${revenue.summary.total_other_revenue}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Revenue</p>
                            <p className="text-lg font-bold text-violet-500">${revenue.summary.total_revenue}</p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={revenueChartData} barCategoryGap="15%">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="room" name="Habitaciones" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="other" name="Otros" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ─── Section 6: Payment Distribution ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-500" />
                            Distribución de Pagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PaymentsDonut data={payments.by_provider} />
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total Pagos</p>
                                <p className="text-lg font-bold">{payments.summary.total_payments}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Promedio</p>
                                <p className="text-lg font-bold">{formatMoney(payments.summary.avg_payment_cents)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-amber-500" />
                            Net Revenue & Reembolsos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Ingresos Brutos</span>
                                <span className="text-sm font-semibold text-foreground">${payments.summary.total_amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-red-400">
                                <span className="text-sm">Reembolsos ({payments.summary.refunds_count})</span>
                                <span className="text-sm font-semibold">-{formatMoney(payments.summary.refunds_total_cents)}</span>
                            </div>
                            <div className="border-t border-border/50 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground">Net Revenue</span>
                                    <span className="text-lg font-bold text-emerald-500">{formatMoney(payments.summary.net_revenue_cents)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Revenue bar visual */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Reembolsos</span>
                                <span>{((payments.summary.refunds_total_cents / (payments.summary.total_amount_cents || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                    style={{
                                        width: `${100 - (payments.summary.refunds_total_cents / (payments.summary.total_amount_cents || 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg/Pago</p>
                                <p className="text-sm font-bold text-emerald-500">{formatMoney(payments.summary.avg_payment_cents)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/10 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Refund Rate</p>
                                <p className="text-sm font-bold text-red-400">
                                    {((payments.summary.refunds_count / (payments.summary.total_payments || 1)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <div className="text-center text-xs text-muted-foreground/50 pt-4 border-t border-border/20">
                HotelMate PMS • Manager Dashboard • {dash.kpis_30d.days_with_data} días de datos disponibles
            </div>
        </div>
    );
}
