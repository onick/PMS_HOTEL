import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Calendar,
  DollarSign,
  Search,
  X,
  Moon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  parseISO,
  isSameDay,
  isToday as isDateToday,
  isWeekend,
} from "date-fns";
import { es } from "date-fns/locale";
import ReservationDetails from "./ReservationDetails";

interface ReservationsTimelineProps {
  hotelId?: string;
  onUpdate?: () => void;
}

// Status config using design system tokens
const STATUS_CONFIG: Record<
  string,
  { bar: string; label: string; dot: string }
> = {
  CONFIRMED: {
    bar: "bg-primary/90 hover:bg-primary",
    label: "Confirmada",
    dot: "bg-primary",
  },
  PENDING: {
    bar: "bg-warning/90 hover:bg-warning",
    label: "Pendiente",
    dot: "bg-warning",
  },
  CANCELLED: {
    bar: "bg-destructive/80 hover:bg-destructive",
    label: "Cancelada",
    dot: "bg-destructive",
  },
  CHECKED_IN: {
    bar: "bg-success/90 hover:bg-success",
    label: "Check-in",
    dot: "bg-success",
  },
  CHECKED_OUT: {
    bar: "bg-muted-foreground/40 hover:bg-muted-foreground/50",
    label: "Check-out",
    dot: "bg-muted-foreground",
  },
};

const formatCurrency = (cents: number, currency?: string) => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: currency || "DOP",
  }).format(cents / 100);
};

// ─── Reservation Bar ────────────────────────────────────────────────
// Extracted so the bar rendering logic lives in one place.
function ReservationBar({
  reservation,
  position,
  totalDays,
  onClick,
}: {
  reservation: any;
  position: { start: number; span: number };
  totalDays: number;
  onClick: () => void;
}) {
  const config = STATUS_CONFIG[reservation.status] || {
    bar: "bg-muted-foreground/40",
    label: reservation.status,
    dot: "bg-muted-foreground",
  };
  const guestName = reservation.guest?.full_name || "Sin nombre";

  // Determine if the bar is clipped at the edges of the visible month
  const checkIn = parseISO(reservation.check_in_date);
  const checkOut = parseISO(reservation.check_out_date);
  const startsBeforeMonth = position.start === 0 && checkIn.getDate() !== 1;
  const endsAfterMonth = position.start + position.span >= totalDays;

  const roundLeft = startsBeforeMonth ? "rounded-l-none" : "rounded-l-md";
  const roundRight = endsAfterMonth ? "rounded-r-none" : "rounded-r-md";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`absolute top-1.5 h-[30px] ${config.bar} text-white text-[11px] leading-tight
            px-2 cursor-pointer transition-colors flex items-center gap-1.5 ${roundLeft} ${roundRight} shadow-sm`}
          style={{
            left: `${(position.start / totalDays) * 100}%`,
            width: `${(position.span / totalDays) * 100}%`,
            minWidth: 24,
          }}
          onClick={onClick}
        >
          <span className="truncate font-medium">{guestName}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{guestName}</span>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                STATUS_CONFIG[reservation.status]?.dot
                  ? `${STATUS_CONFIG[reservation.status].dot}/10 text-foreground border-transparent`
                  : "bg-muted"
              }`}
            >
              {config.label}
            </Badge>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {format(checkIn, "dd MMM", { locale: es })} –{" "}
                {format(checkOut, "dd MMM yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0" />
              <span>
                {reservation.total_adults} huésped
                {reservation.total_adults !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 shrink-0" />
              <span className="font-medium text-foreground">
                {formatCurrency(reservation.total_cents, reservation.currency)}
              </span>
            </div>
            {reservation.guest?.email && (
              <p className="text-muted-foreground pt-0.5">
                {reservation.guest.email}
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Grid Background ────────────────────────────────────────────────
// Renders the vertical day grid lines behind each row.
function DayGridLines({ count }: { count: number }) {
  return (
    <div
      className="grid h-[34px]"
      style={{
        gridTemplateColumns: `repeat(${count}, minmax(36px, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="border-r border-border/20" />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ReservationsTimeline({
  onUpdate,
}: ReservationsTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    try {
      const [roomTypesRes, roomsRes, reservationsRes] = await Promise.all([
        api.getRoomTypes(),
        api.getRooms(),
        api.getReservations({
          from_date: format(start, "yyyy-MM-dd"),
          to_date: format(end, "yyyy-MM-dd"),
          per_page: "200",
        }),
      ]);

      const rtData = roomTypesRes.data || [];
      setRoomTypes(rtData);
      setExpandedTypes(new Set(rtData.map((rt: any) => rt.id)));
      setRooms(roomsRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error("Error loading timeline data:", error);
    }

    setLoading(false);
  };

  // Derived data
  const filteredReservations = useMemo(() => {
    if (!searchTerm.trim()) return reservations;
    const term = searchTerm.toLowerCase();
    return reservations.filter(
      (r) =>
        r.guest?.full_name?.toLowerCase().includes(term) ||
        r.guest?.email?.toLowerCase().includes(term) ||
        r.confirmation_code?.toLowerCase().includes(term)
    );
  }, [searchTerm, reservations]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getReservationPosition = (reservation: any) => {
    const checkIn = parseISO(reservation.check_in_date);
    const checkOut = parseISO(reservation.check_out_date);
    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    const start =
      checkIn < firstDay
        ? 0
        : days.findIndex((day) => isSameDay(day, checkIn));
    const end =
      checkOut > lastDay
        ? days.length - 1
        : days.findIndex((day) => isSameDay(day, checkOut)) - 1;

    if (start === -1 || end < start) return null;
    return { start, span: end - start + 1 };
  };

  const getReservationRoomTypeId = (r: any) => r.units?.[0]?.room_type?.id;
  const getReservationRoomId = (r: any) => r.units?.[0]?.room?.id;

  const getRoomsForType = (roomTypeId: number) =>
    rooms.filter((r: any) => r.room_type_id === roomTypeId);

  const getAvailabilityForDay = (roomTypeId: number, day: Date) => {
    const typeRooms = getRoomsForType(roomTypeId);
    const total = typeRooms.length;
    const reserved = reservations.filter((r) => {
      if (getReservationRoomTypeId(r) !== roomTypeId) return false;
      if (r.status === "CANCELLED") return false;
      const ci = parseISO(r.check_in_date);
      const co = parseISO(r.check_out_date);
      return ci <= day && co > day;
    }).length;
    return { total, reserved, available: total - reserved };
  };

  const toggleRoomType = (typeId: number) => {
    const next = new Set(expandedTypes);
    if (next.has(typeId)) next.delete(typeId);
    else next.add(typeId);
    setExpandedTypes(next);
  };

  // Navigation
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const currentYear = currentMonth.getFullYear();
  const currentYearNow = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYearNow - 1 + i);

  // Column setup
  const SIDEBAR_WIDTH = "180px";
  const gridCols = `${SIDEBAR_WIDTH} repeat(${days.length}, minmax(36px, 1fr))`;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              Cargando timeline...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* ─── Header / Navigation ─────────────────────────────────── */}
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Timeline de Reservas</CardTitle>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar huésped o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-8 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Month + Year navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Month selector */}
          <Select
            value={currentMonth.getMonth().toString()}
            onValueChange={(v) =>
              setCurrentMonth(new Date(currentYear, parseInt(v), 1))
            }
          >
            <SelectTrigger className="h-8 w-[140px] text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(currentYear, i, 1), "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector */}
          <Select
            value={currentYear.toString()}
            onValueChange={(v) =>
              setCurrentMonth(
                new Date(parseInt(v), currentMonth.getMonth(), 1)
              )
            }
          >
            <SelectTrigger className="h-8 w-[90px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="h-8 text-xs"
          >
            Hoy
          </Button>

          {/* Search results count */}
          {searchTerm && (
            <span className="text-xs text-muted-foreground ml-2">
              {filteredReservations.length} de {reservations.length}
            </span>
          )}

          {/* Legend — compact, right-aligned */}
          <div className="ml-auto flex items-center gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-sm ${cfg.dot}`} />
                <span className="text-[11px] text-muted-foreground">
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* ─── Grid ────────────────────────────────────────────────── */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Day header row */}
          <div
            className="grid sticky top-0 bg-card z-20 border-b"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="sticky left-0 bg-card z-30 px-3 py-2 border-r">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Habitaciones
              </span>
            </div>
            {days.map((day) => {
              const today = isDateToday(day);
              const weekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`text-center py-1.5 border-r border-border/40 relative ${
                    today
                      ? "bg-primary/8"
                      : weekend
                        ? "bg-muted/30"
                        : ""
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-wide ${
                      today
                        ? "text-primary font-semibold"
                        : weekend
                          ? "text-muted-foreground/70"
                          : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div
                    className={`text-xs font-bold leading-tight ${
                      today ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  {today && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Room types */}
          {roomTypes.map((roomType) => {
            const typeRooms = getRoomsForType(roomType.id);
            const isExpanded = expandedTypes.has(roomType.id);

            // Pending = reservations for this type with no room assigned
            const pendingReservations = filteredReservations.filter(
              (r) =>
                getReservationRoomTypeId(r) === roomType.id &&
                !getReservationRoomId(r) &&
                r.status !== "CANCELLED"
            );

            return (
              <div key={roomType.id} className="border-b last:border-b-0">
                {/* ── Room Type Header + Availability ────────────── */}
                <div
                  className="grid bg-muted/30"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div
                    className="sticky left-0 bg-muted/50 z-10 px-3 py-2 border-r flex items-center gap-2 cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    onClick={() => toggleRoomType(roomType.id)}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {roomType.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {typeRooms.length} hab.
                        {pendingReservations.length > 0 && (
                          <span className="text-warning ml-1.5">
                            · {pendingReservations.length} sin asignar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Availability circles */}
                  {days.map((day) => {
                    const { available, total } = getAvailabilityForDay(
                      roomType.id,
                      day
                    );
                    const today = isDateToday(day);
                    const weekend = isWeekend(day);
                    const pct = total > 0 ? available / total : 1;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`flex items-center justify-center border-r border-border/40 ${
                          today
                            ? "bg-primary/5"
                            : weekend
                              ? "bg-muted/20"
                              : ""
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            total === 0
                              ? "text-muted-foreground/50"
                              : pct === 0
                                ? "text-destructive"
                                : pct <= 0.3
                                  ? "text-warning"
                                  : "text-success"
                          }`}
                        >
                          {available}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isExpanded && (
                  <>
                    {/* ── Pending (unassigned) row ──────────────────── */}
                    {pendingReservations.length > 0 && (
                      <div
                        className="grid"
                        style={{ gridTemplateColumns: gridCols }}
                      >
                        <div className="sticky left-0 bg-card z-10 px-3 py-0 border-r flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-warning/60" />
                          <span className="text-[11px] text-warning font-medium">
                            Sin asignar
                          </span>
                        </div>
                        <div className="relative col-span-full border-b border-border/40">
                          <DayGridLines count={days.length} />
                          {pendingReservations.map((reservation) => {
                            const position =
                              getReservationPosition(reservation);
                            if (!position) return null;
                            return (
                              <ReservationBar
                                key={reservation.id}
                                reservation={reservation}
                                position={position}
                                totalDays={days.length}
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setDetailsOpen(true);
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Individual room rows ─────────────────────── */}
                    {typeRooms.map((room: any, roomIdx: number) => {
                      const roomReservations = filteredReservations.filter(
                        (r) =>
                          getReservationRoomTypeId(r) === roomType.id &&
                          getReservationRoomId(r) === room.id
                      );

                      return (
                        <div
                          key={room.id}
                          className={`grid ${
                            roomIdx % 2 === 0 ? "" : "bg-muted/10"
                          }`}
                          style={{ gridTemplateColumns: gridCols }}
                        >
                          <div className="sticky left-0 bg-card z-10 px-3 py-0 border-r flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                room.occupancy_status === "VACANT"
                                  ? "bg-success"
                                  : room.occupancy_status === "OCCUPIED"
                                    ? "bg-primary"
                                    : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="text-sm font-medium tabular-nums">
                              {room.number}
                            </span>
                          </div>
                          <div className="relative col-span-full border-b border-border/30">
                            <DayGridLines count={days.length} />
                            {roomReservations.map((reservation) => {
                              const position =
                                getReservationPosition(reservation);
                              if (!position) return null;
                              return (
                                <ReservationBar
                                  key={reservation.id}
                                  reservation={reservation}
                                  position={position}
                                  totalDays={days.length}
                                  onClick={() => {
                                    setSelectedReservation(reservation);
                                    setDetailsOpen(true);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <ReservationDetails
        reservation={selectedReservation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={() => {
          loadData();
          onUpdate?.();
        }}
      />
    </Card>
  );
}
