import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
    data: Array<{ date: string; value: number }>;
    height?: number;
    width?: string;
    color?: string;
    gradientId?: string;
    showTooltip?: boolean;
    className?: string;
    label?: string;
}

export function SparklineChart({
    data,
    height = 60,
    width = '100%',
    color = '#818cf8', // Indigo-400
    gradientId = 'sparklineGrad',
    className,
    label,
}: SparklineChartProps) {
    const { path, areaPath, minVal, maxVal } = useMemo(() => {
        if (!data.length) return { path: '', areaPath: '', minVal: 0, maxVal: 0 };

        const values = data.map((d) => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const padding = 4;
        const chartWidth = 300; // fixed viewBox
        const chartHeight = height - padding * 2;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
            return { x, y };
        });

        const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        // Area path (fill under line)
        const areaStr =
            pathStr +
            ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        return { path: pathStr, areaPath: areaStr, minVal: min, maxVal: max };
    }, [data, height]);

    if (!data.length) {
        return (
            <div
                className={cn('flex items-center justify-center text-xs text-muted-foreground', className)}
                style={{ height }}
            >
                No data
            </div>
        );
    }

    return (
        <div className={cn('relative', className)} style={{ width }}>
            {label && (
                <div className="absolute top-0 left-0 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                </div>
            )}
            <svg
                viewBox={`0 0 300 ${height}`}
                preserveAspectRatio="none"
                className="w-full"
                style={{ height }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path d={areaPath} fill={`url(#${gradientId})`} />

                {/* Line */}
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* End dot */}
                {data.length > 0 && (() => {
                    const values = data.map((d) => d.value);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const range = max - min || 1;
                    const padding = 4;
                    const chartHeight = height - padding * 2;
                    const lastIdx = data.length - 1;
                    const x = (lastIdx / (data.length - 1)) * 300;
                    const y = padding + chartHeight - ((data[lastIdx].value - min) / range) * chartHeight;
                    return (
                        <>
                            <circle cx={x} cy={y} r={4} fill={color} opacity={0.3} />
                            <circle cx={x} cy={y} r={2} fill={color} />
                        </>
                    );
                })()}
            </svg>

            {/* Value labels */}
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
                <span>{data[0]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    );
}
