import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, BedDouble, CalendarDays } from "lucide-react";

interface RoomStatusCardProps {
    roomNumber: string;
    type: string;
    status: "CLEAN" | "DIRTY" | "OCCUPIED" | "MAINTENANCE" | "INSPECTING" | "OUT_OF_SERVICE" | "AVAILABLE" | "CLEANING";
    guestName?: string;
    checkOutDate?: string;
    onClick?: () => void;
    className?: string;
}

const statusColor: Record<string, string> = {
    CLEAN: "bg-emerald-500",
    DIRTY: "bg-amber-500",
    OCCUPIED: "bg-blue-500",
    MAINTENANCE: "bg-rose-500",
    INSPECTING: "bg-indigo-500",
    OUT_OF_SERVICE: "bg-gray-500",
    AVAILABLE: "bg-emerald-500",
    CLEANING: "bg-amber-400",
};

export const RoomStatusCard = React.memo(({
    roomNumber,
    type,
    status,
    guestName,
    checkOutDate,
    onClick,
    className,
}: RoomStatusCardProps) => {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "relative overflow-hidden group hover:shadow-lg transition-all duration-300",
                onClick && "cursor-pointer",
                className
            )}
        >
            <div className={cn("absolute top-0 left-0 w-1 h-full transition-colors duration-300", statusColor[status] || "bg-gray-300")} />
            <CardContent className="p-4 pl-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xl font-bold tracking-tight">{roomNumber}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-bold border-0 px-2 py-0.5 uppercase tracking-wider",
                        status === 'CLEAN' || status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            status === 'DIRTY' || status === 'CLEANING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                    status === 'INSPECTING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
                                        status === 'OUT_OF_SERVICE' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300' :
                                            'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                    )}>
                        {status.replace('_', ' ')}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">{type}</p>

                {status === "OCCUPIED" && guestName ? (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                        <div className="flex items-center text-sm">
                            <User className="h-3 w-3 mr-2 text-primary/70" />
                            <span className="font-medium truncate">{guestName}</span>
                        </div>
                        {checkOutDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3 mr-2" />
                                <span>Salida: {checkOutDate}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-800">
                        <div className="flex items-center text-xs text-muted-foreground">
                            <BedDouble className="h-3 w-3 mr-2" />
                            <span>{status === "AVAILABLE" || status === "CLEAN" ? "Disponible" : status.replace('_', ' ')}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

RoomStatusCard.displayName = "RoomStatusCard";
