import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    CalendarDays,
    Users,
    MapPin,
    Phone,
    Mail,
    Globe,
    Loader2,
    CheckCircle2,
    Wifi,
    Coffee,
    Bath,
    Tv,
    Wind,
    Star,
    ChevronRight,
    ArrowLeft,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface HotelInfo {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    currency: string;
    check_in_time: string;
    check_out_time: string;
    timezone: string;
}

interface RoomTypeResult {
    room_type_id: number;
    name: string;
    description: string | null;
    max_occupancy: number;
    base_occupancy: number;
    amenities: string[];
    images: string[];
    available_units: number;
    rates: Array<{
        rate_plan_id: number;
        rate_plan_name: string;
        total_cents: number;
        total: string;
        avg_per_night: number | null;
        currency: string;
        breakdown: Array<{ date: string; rate_cents: number }>;
    }>;
}

interface BookingConfirmation {
    confirmation_code: string;
    reservation_id: number;
    status: string;
    check_in: string;
    check_out: string;
    total_cents: number;
    total: string;
    currency: string;
    hotel_name: string;
    hotel_email: string;
    hotel_phone: string;
    check_in_time: string;
}

type Step = "search" | "results" | "details" | "confirmation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Amenity icons ──────────────────────────────────────────

const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    "wi-fi": <Wifi className="h-4 w-4" />,
    coffee: <Coffee className="h-4 w-4" />,
    bathroom: <Bath className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
    "air conditioning": <Wind className="h-4 w-4" />,
    ac: <Wind className="h-4 w-4" />,
};

// ─── Component ──────────────────────────────────────────────

export default function BookingEngine() {
    const { slug } = useParams<{ slug: string }>();

    // Hotel info
    const [hotel, setHotel] = useState<HotelInfo | null>(null);
    const [hotelError, setHotelError] = useState<string | null>(null);

    // Search state
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);

    // Results + booking
    const [step, setStep] = useState<Step>("search");
    const [results, setResults] = useState<RoomTypeResult[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomTypeResult | null>(null);
    const [selectedRate, setSelectedRate] = useState<{ rate_plan_id: number; rate_plan_name: string; total: string; total_cents: number } | null>(null);
    const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
    const [nights, setNights] = useState(0);

    // Guest details
    const [guestFirstName, setGuestFirstName] = useState("");
    const [guestLastName, setGuestLastName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    // Loading
    const [loading, setLoading] = useState(false);

    // ─── Fetch hotel info ────────────────────────────────────

    useEffect(() => {
        if (!slug) return;
        fetch(`${API_URL}/booking/${slug}`)
            .then((r) => {
                if (!r.ok) throw new Error("Hotel not found");
                return r.json();
            })
            .then((data) => setHotel(data.data))
            .catch((err) => setHotelError(err.message));
    }, [slug]);

    // ─── Set default dates ───────────────────────────────────

    useEffect(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        setCheckIn(tomorrow.toISOString().split("T")[0]);
        setCheckOut(dayAfter.toISOString().split("T")[0]);
    }, []);

    // ─── Search ──────────────────────────────────────────────

    const handleSearch = async () => {
        if (!slug || !checkIn || !checkOut) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/booking/${slug}/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ check_in: checkIn, check_out: checkOut, adults, children }),
            });
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            setResults(data.data);
            setNights(data.meta.nights);
            setStep("results");
        } catch {
            alert("Error searching availability.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Select room ─────────────────────────────────────────

    const handleSelectRoom = (room: RoomTypeResult, rate: (typeof room.rates)[0]) => {
        setSelectedRoom(room);
        setSelectedRate({ rate_plan_id: rate.rate_plan_id, rate_plan_name: rate.rate_plan_name, total: rate.total, total_cents: rate.total_cents });
        setStep("details");
    };

    // ─── Reserve ─────────────────────────────────────────────

    const handleReserve = async () => {
        if (!slug || !selectedRoom || !selectedRate) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/booking/${slug}/reserve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    check_in: checkIn,
                    check_out: checkOut,
                    room_type_id: selectedRoom.room_type_id,
                    rate_plan_id: selectedRate.rate_plan_id,
                    adults,
                    children,
                    guest_first_name: guestFirstName,
                    guest_last_name: guestLastName,
                    guest_email: guestEmail,
                    guest_phone: guestPhone || undefined,
                    special_requests: specialRequests || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Reservation failed");
            }
            const data = await res.json();
            setConfirmation(data.data);
            setStep("confirmation");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Error creating reservation.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Error state ─────────────────────────────────────────

    if (hotelError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="max-w-md w-full mx-4">
                    <CardContent className="py-12 text-center">
                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Hotel no encontrado</h2>
                        <p className="text-muted-foreground">
                            El enlace de reservas no es válido o el hotel no está disponible.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Loading hotel ───────────────────────────────────────

    if (!hotel) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const currencySymbol = hotel.currency === "DOP" ? "RD$" : hotel.currency === "EUR" ? "€" : "$";

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* ─── Top Bar ──────────────────────────────────────── */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {hotel.logo_url ? (
                            <img src={hotel.logo_url} alt={hotel.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {hotel.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{hotel.name}</h1>
                            {hotel.city && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                        {hotel.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{hotel.phone}</span>
                        )}
                        {hotel.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{hotel.email}</span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* ═══ STEP: SEARCH ═══════════════════════════════ */}
                {step === "search" && (
                    <div className="space-y-8">
                        {/* Hero */}
                        <div className="text-center space-y-3 py-8">
                            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Reserva tu estancia
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                                Disponibilidad en tiempo real · Mejor precio garantizado · Confirmación instantánea
                            </p>
                        </div>

                        {/* Search form */}
                        <Card className="max-w-3xl mx-auto shadow-xl border-0 bg-white">
                            <CardContent className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <CalendarDays className="h-4 w-4 text-indigo-500" /> Check-in
                                        </Label>
                                        <Input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <CalendarDays className="h-4 w-4 text-indigo-500" /> Check-out
                                        </Label>
                                        <Input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            min={checkIn}
                                            className="text-base"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Users className="h-4 w-4 text-indigo-500" /> Adultos
                                        </Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={adults}
                                            onChange={(e) => setAdults(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Users className="h-4 w-4 text-indigo-500" /> Niños
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={10}
                                            value={children}
                                            onChange={(e) => setChildren(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    disabled={loading || !checkIn || !checkOut}
                                    className="w-full h-12 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <CalendarDays className="h-5 w-5 mr-2" />
                                    )}
                                    Buscar Disponibilidad
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Trust badges */}
                        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Confirmación instantánea</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sin cargos ocultos</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cancelación flexible</span>
                        </div>
                    </div>
                )}

                {/* ═══ STEP: RESULTS ══════════════════════════════ */}
                {step === "results" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Button variant="ghost" size="sm" onClick={() => setStep("search")} className="mb-2">
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Cambiar fechas
                                </Button>
                                <h2 className="text-2xl font-bold">Habitaciones Disponibles</h2>
                                <p className="text-muted-foreground">
                                    {checkIn} → {checkOut} · {nights} noche{nights !== 1 ? "s" : ""} · {adults} adulto{adults !== 1 ? "s" : ""}
                                    {children > 0 && ` · ${children} niño${children !== 1 ? "s" : ""}`}
                                </p>
                            </div>
                        </div>

                        {results.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Sin disponibilidad</h3>
                                    <p className="text-muted-foreground">
                                        No hay habitaciones disponibles para las fechas seleccionadas.
                                    </p>
                                    <Button className="mt-4" onClick={() => setStep("search")}>
                                        Modificar búsqueda
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {results.map((room) => (
                                    <Card key={room.room_type_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="md:flex">
                                            {/* Image placeholder */}
                                            <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
                                                {room.images?.[0] ? (
                                                    <img
                                                        src={room.images[0]}
                                                        alt={room.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="text-5xl mb-2">🏨</div>
                                                        <p className="text-xs text-indigo-400">{room.name}</p>
                                                    </div>
                                                )}
                                                <Badge className="absolute top-3 right-3 bg-white/90 text-indigo-700 border-0 shadow">
                                                    {room.available_units} disponible{room.available_units !== 1 ? "s" : ""}
                                                </Badge>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold">{room.name}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Hasta {room.max_occupancy} huéspedes
                                                        </p>
                                                    </div>
                                                </div>

                                                {room.description && (
                                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                        {room.description}
                                                    </p>
                                                )}

                                                {/* Amenities */}
                                                {room.amenities?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {room.amenities.slice(0, 6).map((a) => (
                                                            <Badge key={a} variant="secondary" className="text-xs gap-1">
                                                                {amenityIcons[a.toLowerCase()] ?? <Star className="h-3 w-3" />}
                                                                {a}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                <Separator className="mb-4" />

                                                {/* Rates */}
                                                <div className="space-y-3">
                                                    {room.rates.map((rate) => (
                                                        <div
                                                            key={rate.rate_plan_id}
                                                            className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-sm">{rate.rate_plan_name}</p>
                                                                <p className="text-xs text-muted-foreground">{nights} noches</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <p className="text-xl font-bold text-indigo-600">
                                                                        {currencySymbol}{rate.total}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">total</p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSelectRoom(room, rate)}
                                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow group-hover:shadow-md"
                                                                >
                                                                    Seleccionar <ChevronRight className="h-4 w-4 ml-1" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ STEP: GUEST DETAILS ════════════════════════ */}
                {step === "details" && selectedRoom && selectedRate && (
                    <div className="space-y-6">
                        <Button variant="ghost" size="sm" onClick={() => setStep("results")}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a resultados
                        </Button>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Guest form */}
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold mb-4">Datos del Huésped</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nombre *</Label>
                                                <Input
                                                    placeholder="Juan"
                                                    value={guestFirstName}
                                                    onChange={(e) => setGuestFirstName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Apellido *</Label>
                                                <Input
                                                    placeholder="Pérez"
                                                    value={guestLastName}
                                                    onChange={(e) => setGuestLastName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email *</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="juan@ejemplo.com"
                                                    value={guestEmail}
                                                    onChange={(e) => setGuestEmail(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Teléfono</Label>
                                                <Input
                                                    type="tel"
                                                    placeholder="+1 809-555-0100"
                                                    value={guestPhone}
                                                    onChange={(e) => setGuestPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <Label>Solicitudes especiales</Label>
                                            <textarea
                                                className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Piso alto, cama adicional, late checkout..."
                                                value={specialRequests}
                                                onChange={(e) => setSpecialRequests(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    onClick={handleReserve}
                                    disabled={loading || !guestFirstName || !guestLastName || !guestEmail}
                                    className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                    )}
                                    Confirmar Reserva
                                </Button>
                            </div>

                            {/* Booking summary */}
                            <div>
                                <Card className="sticky top-20 shadow-lg">
                                    <CardContent className="p-5">
                                        <h4 className="font-bold mb-3">Resumen de Reserva</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="p-3 bg-indigo-50/50 rounded-lg">
                                                <p className="font-semibold">{selectedRoom.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedRate.rate_plan_name}</p>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Check-in</span>
                                                <span className="font-medium">{checkIn}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Check-out</span>
                                                <span className="font-medium">{checkOut}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Noches</span>
                                                <span className="font-medium">{nights}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Huéspedes</span>
                                                <span className="font-medium">{adults} adulto{adults !== 1 ? "s" : ""}</span>
                                            </div>

                                            <Separator />

                                            <div className="flex justify-between items-center pt-1">
                                                <span className="font-semibold text-lg">Total</span>
                                                <span className="text-2xl font-bold text-indigo-600">
                                                    {currencySymbol}{selectedRate.total}
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Impuestos incluidos · Check-in: {hotel.check_in_time}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ STEP: CONFIRMATION ═════════════════════════ */}
                {step === "confirmation" && confirmation && (
                    <div className="max-w-2xl mx-auto space-y-8 py-8">
                        {/* Success banner */}
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-emerald-700">¡Reserva Confirmada!</h2>
                            <p className="text-muted-foreground">
                                Hemos confirmado tu reserva. Un email de confirmación será enviado a tu correo.
                            </p>
                        </div>

                        {/* Confirmation card */}
                        <Card className="shadow-xl border-0">
                            <CardContent className="p-8">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">Código de Confirmación</p>
                                    <p className="text-4xl font-extrabold tracking-wider text-indigo-600">
                                        {confirmation.confirmation_code}
                                    </p>
                                </div>

                                <Separator className="my-6" />

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Hotel</p>
                                        <p className="font-semibold">{confirmation.hotel_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Estado</p>
                                        <Badge className="bg-emerald-500 text-white">{confirmation.status}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Check-in</p>
                                        <p className="font-semibold">{confirmation.check_in} · {confirmation.check_in_time}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Check-out</p>
                                        <p className="font-semibold">{confirmation.check_out}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold text-indigo-600">
                                            {currencySymbol}{confirmation.total}
                                        </p>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="text-center text-sm text-muted-foreground space-y-1">
                                    {confirmation.hotel_phone && (
                                        <p className="flex items-center justify-center gap-1">
                                            <Phone className="h-3 w-3" /> {confirmation.hotel_phone}
                                        </p>
                                    )}
                                    {confirmation.hotel_email && (
                                        <p className="flex items-center justify-center gap-1">
                                            <Mail className="h-3 w-3" /> {confirmation.hotel_email}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="text-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep("search");
                                    setSelectedRoom(null);
                                    setSelectedRate(null);
                                    setConfirmation(null);
                                    setGuestFirstName("");
                                    setGuestLastName("");
                                    setGuestEmail("");
                                    setGuestPhone("");
                                    setSpecialRequests("");
                                }}
                            >
                                Hacer otra reserva
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Footer ───────────────────────────────────────── */}
            <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground bg-white/50">
                <p>
                    Powered by{" "}
                    <span className="font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        HotelMate
                    </span>{" "}
                    · Reservations Engine
                </p>
                <p className="mt-1">
                    © {new Date().getFullYear()} {hotel.name}. Todos los derechos reservados.
                </p>
            </footer>
        </div>
    );
}
