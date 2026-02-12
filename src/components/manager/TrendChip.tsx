import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendChipProps {
    direction: 'up' | 'down' | 'stable';
    label: string;
    className?: string;
}

export function TrendChip({ direction, label, className }: TrendChipProps) {
    const config = {
        up: {
            icon: TrendingUp,
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            text: 'text-emerald-500',
        },
        down: {
            icon: TrendingDown,
            bg: 'bg-red-400/10 border-red-400/20',
            text: 'text-red-400',
        },
        stable: {
            icon: Minus,
            bg: 'bg-muted/50 border-border/50',
            text: 'text-muted-foreground',
        },
    };

    const { icon: Icon, bg, text } = config[direction];

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                bg,
                text,
                className,
            )}
        >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
        </div>
    );
}
