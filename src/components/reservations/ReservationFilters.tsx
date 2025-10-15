import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface ReservationFiltersProps {
  onFilterChange: (filters: ReservationFilters) => void;
}

export interface ReservationFilters {
  search: string;
  status: string;
  dateRange?: DateRange;
  roomType: string;
}

export default function ReservationFilters({ onFilterChange }: ReservationFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [roomType, setRoomType] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const applyFilters = () => {
    onFilterChange({
      search,
      status,
      dateRange,
      roomType,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setRoomType("all");
    setDateRange(undefined);
    onFilterChange({
      search: "",
      status: "all",
      dateRange: undefined,
      roomType: "all",
    });
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros de Búsqueda</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Búsqueda */}
        <div className="space-y-2">
          <Label>Búsqueda</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nombre, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="CONFIRMED">Confirmada</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pendiente</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de habitación */}
        <div className="space-y-2">
          <Label>Tipo de Habitación</Label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="standard">Estándar</SelectItem>
              <SelectItem value="deluxe">Deluxe</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rango de fechas */}
        <div className="space-y-2">
          <Label>Rango de Fechas</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={applyFilters} className="bg-primary hover:bg-primary-hover">
          <Search className="h-4 w-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
