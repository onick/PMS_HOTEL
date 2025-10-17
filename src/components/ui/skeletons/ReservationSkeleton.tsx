import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReservationSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <Skeleton className="h-4 w-40" />
        </div>

        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export function ReservationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <ReservationSkeleton key={i} />
      ))}
    </div>
  );
}
