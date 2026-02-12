import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'stable';
    trendLabel?: string;
    comparison?: string;
    variant?: 'default' | 'revenue' | 'occupancy' | 'highlight';
    className?: string;
}

export function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    comparison,
    variant = 'default',
    className,
}: KpiCardProps) {
    const variantStyles = {
        default: 'bg-card border border-border/50',
        revenue: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20',
        occupancy: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20',
        highlight: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20',
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

    return (
        <div
            className={cn(
                'rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:scale-[1.01]',
                variantStyles[variant],
                className,
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
                {Icon && (
                    <div className="p-1.5 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                {trend && (
                    <div className={cn('flex items-center gap-1', trendColor)}>
                        <TrendIcon className="h-3.5 w-3.5" />
                        {trendLabel && <span className="text-xs font-medium">{trendLabel}</span>}
                    </div>
                )}
            </div>

            {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}

            {comparison && (
                <p className="mt-2 text-[11px] text-muted-foreground/70 border-t border-border/30 pt-2">
                    vs 30d: <span className="font-medium text-muted-foreground">{comparison}</span>
                </p>
            )}
        </div>
    );
}
