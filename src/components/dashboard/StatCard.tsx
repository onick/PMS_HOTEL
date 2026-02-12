import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: number;
    trendLabel?: string;
    accentColor?: "primary" | "secondary" | "accent" | "blue" | "green" | "emerald" | "rose" | "indigo" | "purple" | "orange";
    className?: string;
}

const colorMap = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent-foreground bg-accent/20",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    green: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    rose: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
    indigo: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
};

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendLabel,
    accentColor = "primary",
    className,
}: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg transition-colors duration-300", colorMap[accentColor])}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight mb-1">{value}</div>

                <div className="flex items-center text-xs text-muted-foreground">
                    {trend !== undefined && (
                        <span
                            className={cn(
                                "flex items-center font-medium mr-2 rounded px-1 py-0.5",
                                trend >= 0
                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                                    : "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400"
                            )}
                        >
                            {trend >= 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                    )}

                    {(trendLabel || description) && (
                        <span className="truncate">
                            {trendLabel || description}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
