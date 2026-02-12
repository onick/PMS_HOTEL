import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface PaymentProvider {
    provider: string;
    count: number;
    amount_cents: number;
    amount: string;
    percentage_amount: number;
    percentage_count: number;
}

interface PaymentsDonutProps {
    data: PaymentProvider[];
    className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
    CASH: 'Efectivo',
    CARD_TERMINAL: 'Tarjeta',
    STRIPE: 'Stripe',
    TRANSFER: 'Transferencia',
    MANUAL: 'Manual',
};

const PROVIDER_COLORS: Record<string, string> = {
    CASH: '#10b981',      // Emerald
    CARD_TERMINAL: '#6366f1', // Indigo
    STRIPE: '#8b5cf6',    // Violet
    TRANSFER: '#f59e0b',  // Amber
    MANUAL: '#64748b',    // Slate
};

export function PaymentsDonut({ data, className }: PaymentsDonutProps) {
    const chartData = data.map((d) => ({
        name: PROVIDER_LABELS[d.provider] || d.provider,
        value: d.amount_cents / 100,
        percentage: d.percentage_amount,
        count: d.count,
        fill: PROVIDER_COLORS[d.provider] || '#94a3b8',
    }));

    const totalAmount = data.reduce((sum, d) => sum + d.amount_cents, 0) / 100;

    return (
        <div className={cn('flex items-center gap-6', className)}>
            {/* Donut */}
            <div className="relative w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className="text-sm font-bold text-foreground">
                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
                {chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-xs font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{item.count} pagos</span>
                            <span className="text-xs font-semibold tabular-nums text-foreground w-14 text-right">
                                {item.percentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
