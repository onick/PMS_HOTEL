import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Calendar, Clock, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface GuestListItemProps {
    id: string;
    guestName: string;
    roomType: string;
    roomNumber?: string;
    guestsCount: number;
    date: string;
    time?: string;
    status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "PENDING_PAYMENT";
    type: "arrival" | "departure";
    onAction: () => void;
    actionLabel: string;
    secondaryAction?: React.ReactNode;
}

export const GuestListItem = React.memo(({
    id,
    guestName,
    roomType,
    roomNumber,
    guestsCount,
    date,
    time,
    status,
    type,
    onAction,
    actionLabel,
    secondaryAction,
}: GuestListItemProps) => {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const statusColors = {
        CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        CHECKED_IN: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
        CHECKED_OUT: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
        CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
        PENDING_PAYMENT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    };

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl border border-border/40 hover:border-primary/20 hover:bg-muted/30 transition-all duration-300 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background shadow-sm flex-shrink-0">
                    <AvatarFallback className={cn(
                        "text-xs font-bold",
                        type === "arrival" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                        {getInitials(guestName)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground/90 truncate">{guestName}</span>
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider border-0 px-1.5 py-0 flex-shrink-0", statusColors[status] || statusColors.CONFIRMED)}>
                            {status.replace("_", " ")}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground/70">
                            {roomNumber ? `Hab. ${roomNumber}` : 'Sin asignar'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                        <span className="hidden sm:inline">{roomType}</span>
                        <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {guestsCount}
                        </span>
                        {time && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:flex-shrink-0">
                {secondaryAction}
                <Button
                    size="sm"
                    onClick={onAction}
                    className={cn(
                        "shadow-sm transition-all duration-300 w-full sm:w-auto min-h-[44px] sm:min-h-0",
                        type === "arrival"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                    )}
                >
                    {actionLabel}
                    <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
            </div>
        </div>
    );
});

GuestListItem.displayName = "GuestListItem";
