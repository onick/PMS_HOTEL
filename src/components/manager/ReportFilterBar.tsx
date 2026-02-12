import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ReportFilterBarProps {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    granularity?: 'day' | 'week' | 'month';
    onGranularityChange?: (value: 'day' | 'week' | 'month') => void;
    showGranularity?: boolean;
    className?: string;
}

const PRESETS = [
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 },
    { label: 'YTD', days: -1 }, // special: year-to-date
];

function getDateStr(daysAgo: number): string {
    if (daysAgo === -1) {
        // Year-to-date
        const now = new Date();
        return `${now.getFullYear()}-01-01`;
    }
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

export function ReportFilterBar({
    from,
    to,
    onFromChange,
    onToChange,
    granularity,
    onGranularityChange,
    showGranularity = false,
    className,
}: ReportFilterBarProps) {
    const [activePreset, setActivePreset] = useState<number | null>(30);

    const handlePreset = (days: number) => {
        setActivePreset(days);
        onFromChange(getDateStr(days));
        onToChange(todayStr());
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-3', className)}>
            {/* Preset buttons */}
            <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                {PRESETS.map((p) => (
                    <button
                        key={p.days}
                        onClick={() => handlePreset(p.days)}
                        className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                            activePreset === p.days
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Date inputs */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => {
                            setActivePreset(null);
                            onFromChange(e.target.value);
                        }}
                        className="pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                </div>
                <span className="text-muted-foreground text-xs">→</span>
                <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => {
                            setActivePreset(null);
                            onToChange(e.target.value);
                        }}
                        className="pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Granularity selector */}
            {showGranularity && onGranularityChange && (
                <Select value={granularity} onValueChange={(v) => onGranularityChange(v as any)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue placeholder="Agrupar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Por día</SelectItem>
                        <SelectItem value="week">Por semana</SelectItem>
                        <SelectItem value="month">Por mes</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
