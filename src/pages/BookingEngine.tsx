import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
    Shield,
    Clock,
    Sparkles,
    Sun,
} from "lucide-react";

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║  BOOKING ENGINE — Public-facing hotel reservation wizard    ║
 ║                                                              ║
 ║  Design: Caribbean hospitality — warm sand, ocean depth,     ║
 ║  coral stone. Not SaaS purple. Feels like a hotel lobby.     ║
 ║                                                              ║
 ║  Signature: "Horizon line" — warm gradient bar evoking       ║
 ║  ocean-meets-sky, used as section dividers and accents.       ║
 ╚══════════════════════════════════════════════════════════════╝
*/

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

// ─── Token System ───────────────────────────────────────────
// Caribbean Hospitality palette — derived from physical spaces:
// sand floors, coral stone walls, deep ocean, tropical foliage

const tokens = {
    // Surfaces — warm sand family, whisper-quiet elevation shifts
    sand: "hsl(35, 40%, 93%)",     // base canvas
    sandLight: "hsl(35, 45%, 96%)",     // elevated surface
    sandDark: "hsl(35, 30%, 88%)",     // inset / input bg
    coral: "hsl(25, 35%, 75%)",     // borders, warm stone
    coralLight: "hsl(25, 30%, 90%)",     // subtle border

    // Ocean — primary action color
    ocean: "hsl(200, 65%, 30%)",    // deep, trustworthy
    oceanLight: "hsl(200, 55%, 40%)",    // hover
    oceanPale: "hsl(200, 40%, 92%)",    // light bg tint

    // Accents
    terracotta: "hsl(18, 50%, 52%)",     // warm accent, pricing
    tropical: "hsl(155, 40%, 45%)",    // success, confirmation
    tropicalPale: "hsl(155, 35%, 92%)",  // success bg

    // Text hierarchy
    ink: "hsl(25, 20%, 15%)",     // primary text
    inkSecondary: "hsl(25, 12%, 40%)",   // secondary
    inkTertiary: "hsl(25, 8%, 55%)",     // tertiary / metadata
    inkMuted: "hsl(25, 6%, 68%)",      // disabled / placeholder

    // Structural
    radius: "10px",                  // friendly, not bubbly
    radiusSm: "6px",
    radiusLg: "14px",
    shadow: "0 1px 3px hsla(25, 20%, 15%, 0.06), 0 1px 2px hsla(25, 20%, 15%, 0.04)",
    shadowLg: "0 4px 12px hsla(25, 20%, 15%, 0.08), 0 2px 4px hsla(25, 20%, 15%, 0.04)",
    shadowXl: "0 8px 24px hsla(25, 20%, 15%, 0.1), 0 4px 8px hsla(25, 20%, 15%, 0.05)",
} as const;

// ─── Amenity icons ──────────────────────────────────────────

const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi size={14} />,
    "wi-fi": <Wifi size={14} />,
    coffee: <Coffee size={14} />,
    bathroom: <Bath size={14} />,
    tv: <Tv size={14} />,
    "air conditioning": <Wind size={14} />,
    ac: <Wind size={14} />,
};

// ─── Inline styles (no tailwind — full control) ─────────────

const styles = {
    page: {
        minHeight: "100vh",
        background: `linear-gradient(165deg, ${tokens.sandLight} 0%, ${tokens.sand} 40%, ${tokens.oceanPale} 100%)`,
        fontFamily: "'DM Sans', 'Inter', system-ui, -apple-system, sans-serif",
        color: tokens.ink,
        WebkitFontSmoothing: "antialiased" as const,
    },

    header: {
        position: "sticky" as const,
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(16px) saturate(1.2)",
        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
        backgroundColor: "hsla(35, 40%, 96%, 0.85)",
        borderBottom: `1px solid ${tokens.coralLight}`,
    },

    headerInner: {
        maxWidth: 960,
        margin: "0 auto",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },

    // Signature element: horizon line
    horizonLine: {
        height: 3,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${tokens.terracotta}, ${tokens.ocean}, ${tokens.tropical})`,
        opacity: 0.5,
    },

    card: {
        background: tokens.sandLight,
        border: `1px solid ${tokens.coralLight}`,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowLg,
    },

    input: {
        width: "100%",
        padding: "10px 14px",
        fontSize: 15,
        fontFamily: "inherit",
        color: tokens.ink,
        backgroundColor: tokens.sandDark,
        border: `1px solid ${tokens.coralLight}`,
        borderRadius: tokens.radiusSm,
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    },

    label: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 550,
        color: tokens.inkSecondary,
        letterSpacing: "0.01em",
        marginBottom: 6,
    },

    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "14px 24px",
        fontSize: 15,
        fontWeight: 600,
        fontFamily: "inherit",
        color: "#fff",
        background: `linear-gradient(135deg, ${tokens.ocean}, ${tokens.oceanLight})`,
        border: "none",
        borderRadius: tokens.radius,
        cursor: "pointer",
        boxShadow: `0 2px 8px hsla(200, 65%, 30%, 0.25)`,
        transition: "all 0.2s ease",
        letterSpacing: "0.01em",
    },

    btnConfirm: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "14px 24px",
        fontSize: 15,
        fontWeight: 600,
        fontFamily: "inherit",
        color: "#fff",
        background: `linear-gradient(135deg, ${tokens.tropical}, hsl(155, 45%, 38%))`,
        border: "none",
        borderRadius: tokens.radius,
        cursor: "pointer",
        boxShadow: `0 2px 8px hsla(155, 40%, 45%, 0.25)`,
        transition: "all 0.2s ease",
    },

    btnGhost: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        color: tokens.inkSecondary,
        background: "transparent",
        border: "none",
        borderRadius: tokens.radiusSm,
        cursor: "pointer",
        transition: "color 0.15s ease",
    },

    btnSelect: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        color: "#fff",
        background: tokens.ocean,
        border: "none",
        borderRadius: tokens.radiusSm,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },

    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 500,
        color: tokens.inkSecondary,
        background: tokens.sandDark,
        borderRadius: 20,
        border: `1px solid ${tokens.coralLight}`,
    },
} as const;


// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function BookingEngine() {
    const { slug } = useParams<{ slug: string }>();

    const [hotel, setHotel] = useState<HotelInfo | null>(null);
    const [hotelError, setHotelError] = useState<string | null>(null);
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [step, setStep] = useState<Step>("search");
    const [results, setResults] = useState<RoomTypeResult[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomTypeResult | null>(null);
    const [selectedRate, setSelectedRate] = useState<{ rate_plan_id: number; rate_plan_name: string; total: string; total_cents: number } | null>(null);
    const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
    const [nights, setNights] = useState(0);
    const [guestFirstName, setGuestFirstName] = useState("");
    const [guestLastName, setGuestLastName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");
    const [loading, setLoading] = useState(false);

    // ─── Load Google Font ────────────────────────────────────
    useEffect(() => {
        if (!document.querySelector('link[href*="DM+Sans"]')) {
            const link = document.createElement("link");
            link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap";
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
    }, []);

    // ─── Fetch hotel ─────────────────────────────────────────
    useEffect(() => {
        if (!slug) return;
        fetch(`${API_URL}/booking/${slug}`)
            .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
            .then((data) => setHotel(data.data))
            .catch((err) => setHotelError(err.message));
    }, [slug]);

    // ─── Default dates ───────────────────────────────────────
    useEffect(() => {
        const t = new Date();
        const d1 = new Date(t); d1.setDate(d1.getDate() + 1);
        const d2 = new Date(t); d2.setDate(d2.getDate() + 2);
        setCheckIn(d1.toISOString().split("T")[0]);
        setCheckOut(d2.toISOString().split("T")[0]);
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
        } catch { alert("Error buscando disponibilidad."); }
        finally { setLoading(false); }
    };

    const handleSelectRoom = (room: RoomTypeResult, rate: (typeof room.rates)[0]) => {
        setSelectedRoom(room);
        setSelectedRate({ rate_plan_id: rate.rate_plan_id, rate_plan_name: rate.rate_plan_name, total: rate.total, total_cents: rate.total_cents });
        setStep("details");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleReserve = async () => {
        if (!slug || !selectedRoom || !selectedRate) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/booking/${slug}/reserve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    check_in: checkIn, check_out: checkOut,
                    room_type_id: selectedRoom.room_type_id, rate_plan_id: selectedRate.rate_plan_id,
                    adults, children,
                    guest_first_name: guestFirstName, guest_last_name: guestLastName,
                    guest_email: guestEmail, guest_phone: guestPhone || undefined,
                    special_requests: specialRequests || undefined,
                }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || "failed"); }
            const data = await res.json();
            setConfirmation(data.data);
            setStep("confirmation");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err: unknown) { alert(err instanceof Error ? err.message : "Error."); }
        finally { setLoading(false); }
    };

    // ─── Error / Loading ─────────────────────────────────────

    if (hotelError) {
        return (
            <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ ...styles.card, padding: 48, textAlign: "center", maxWidth: 400, margin: "0 20px" }}>
                    <Globe size={40} color={tokens.inkTertiary} style={{ margin: "0 auto 16px" }} />
                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Hotel no encontrado</h2>
                    <p style={{ fontSize: 14, color: tokens.inkTertiary, lineHeight: 1.5 }}>
                        El enlace de reservas no es válido o el hotel no está disponible.
                    </p>
                </div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={28} color={tokens.ocean} style={{ animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    const cur = hotel.currency === "DOP" ? "RD$" : hotel.currency === "EUR" ? "€" : "$";

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    return (
        <div style={styles.page}>
            {/* ─── HEADER ──────────────────────────────────────── */}
            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {hotel.logo_url ? (
                            <img src={hotel.logo_url} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover" }} />
                        ) : (
                            <div style={{
                                width: 38, height: 38, borderRadius: 8,
                                background: `linear-gradient(135deg, ${tokens.ocean}, ${tokens.terracotta})`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: 700, fontSize: 16,
                            }}>
                                {hotel.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 650, fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{hotel.name}</div>
                            {hotel.city && (
                                <div style={{ fontSize: 12, color: tokens.inkTertiary, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                                    <MapPin size={11} /> {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: tokens.inkTertiary }}>
                        {hotel.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{hotel.phone}</span>}
                        {hotel.email && <span style={{ display: "none", alignItems: "center", gap: 4 }} className="booking-contact-email"><Mail size={11} />{hotel.email}</span>}
                    </div>
                </div>
            </header>

            {/* Signature: horizon line under header */}
            <div style={styles.horizonLine} />

            <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>

                {/* ═══ STEP 1: SEARCH ═══════════════════════════════ */}
                {step === "search" && (
                    <div style={{ maxWidth: 560, margin: "0 auto" }}>
                        {/* Hero */}
                        <div style={{ textAlign: "center", padding: "48px 0 40px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: tokens.oceanPale, color: tokens.ocean, fontSize: 12, fontWeight: 550, marginBottom: 20 }}>
                                <Sun size={13} /> Reserva directa · Mejor precio
                            </div>
                            <h2 style={{
                                fontSize: "clamp(32px, 6vw, 44px)",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                lineHeight: 1.1,
                                color: tokens.ink,
                                marginBottom: 12,
                            }}>
                                Tu próxima<br />
                                <span style={{ color: tokens.ocean }}>estancia</span> te espera
                            </h2>
                            <p style={{ fontSize: 15, color: tokens.inkTertiary, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
                                Busca disponibilidad y reserva al instante. Sin intermediarios, sin comisiones extra.
                            </p>
                        </div>

                        {/* Search card */}
                        <div style={{ ...styles.card, padding: "28px 28px 24px" }}>
                            {/* Dates */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={styles.label}><CalendarDays size={14} color={tokens.ocean} /> Llegada</label>
                                    <input
                                        type="date" value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        style={styles.input}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}><CalendarDays size={14} color={tokens.ocean} /> Salida</label>
                                    <input
                                        type="date" value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        min={checkIn}
                                        style={styles.input}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                </div>
                            </div>

                            {/* Guests */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                <div>
                                    <label style={styles.label}><Users size={14} color={tokens.ocean} /> Adultos</label>
                                    <input
                                        type="number" min={1} max={10} value={adults}
                                        onChange={(e) => setAdults(Number(e.target.value))}
                                        style={styles.input}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}><Users size={14} color={tokens.ocean} /> Niños</label>
                                    <input
                                        type="number" min={0} max={10} value={children}
                                        onChange={(e) => setChildren(Number(e.target.value))}
                                        style={styles.input}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleSearch}
                                disabled={loading || !checkIn || !checkOut}
                                style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CalendarDays size={18} />}
                                Buscar Disponibilidad
                            </button>
                        </div>

                        {/* Trust signals */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
                            {[
                                { icon: <Shield size={14} />, label: "Pago seguro" },
                                { icon: <Clock size={14} />, label: "Confirmación al instante" },
                                { icon: <Sparkles size={14} />, label: "Mejor tarifa directa" },
                            ].map((t) => (
                                <span key={t.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: tokens.inkTertiary, fontWeight: 450 }}>
                                    {t.icon} {t.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: RESULTS ══════════════════════════════ */}
                {step === "results" && (
                    <div>
                        <button style={styles.btnGhost} onClick={() => setStep("search")}>
                            <ArrowLeft size={15} /> Cambiar fechas
                        </button>

                        <div style={{ marginTop: 8, marginBottom: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Habitaciones Disponibles</h2>
                            <p style={{ fontSize: 14, color: tokens.inkTertiary, marginTop: 4 }}>
                                {checkIn} → {checkOut} · {nights} noche{nights !== 1 ? "s" : ""} · {adults} adulto{adults !== 1 ? "s" : ""}
                                {children > 0 && ` · ${children} niño${children !== 1 ? "s" : ""}`}
                            </p>
                        </div>

                        {/* ─── Horizon line ─── */}
                        <div style={{ ...styles.horizonLine, marginBottom: 24 }} />

                        {results.length === 0 ? (
                            <div style={{ ...styles.card, padding: 64, textAlign: "center" }}>
                                <CalendarDays size={40} color={tokens.inkMuted} style={{ margin: "0 auto 16px" }} />
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sin disponibilidad</h3>
                                <p style={{ fontSize: 14, color: tokens.inkTertiary, marginBottom: 20 }}>
                                    No hay habitaciones para las fechas seleccionadas.
                                </p>
                                <button style={{ ...styles.btnPrimary, width: "auto", padding: "10px 24px" }} onClick={() => setStep("search")}>
                                    Modificar búsqueda
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {results.map((room) => (
                                    <div key={room.room_type_id} style={{ ...styles.card, overflow: "hidden", transition: "box-shadow 0.2s ease" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = tokens.shadowXl; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = tokens.shadowLg; }}>
                                        <div style={{ display: "flex", flexDirection: "row" }}>
                                            {/* Room image area */}
                                            <div style={{
                                                width: 240, minHeight: 200, flexShrink: 0,
                                                background: `linear-gradient(135deg, ${tokens.oceanPale}, hsl(25, 30%, 90%))`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                position: "relative",
                                            }}>
                                                {room.images?.[0] ? (
                                                    <img src={room.images[0]} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ textAlign: "center", padding: 20 }}>
                                                        <div style={{ fontSize: 48, marginBottom: 8 }}>🏨</div>
                                                        <div style={{ fontSize: 11, color: tokens.inkMuted }}>{room.name}</div>
                                                    </div>
                                                )}
                                                <span style={{
                                                    position: "absolute", top: 10, right: 10,
                                                    padding: "3px 10px", borderRadius: 16,
                                                    fontSize: 11, fontWeight: 600,
                                                    background: "hsla(35, 40%, 96%, 0.92)",
                                                    color: tokens.ocean,
                                                    backdropFilter: "blur(8px)",
                                                }}>
                                                    {room.available_units} disponible{room.available_units !== 1 ? "s" : ""}
                                                </span>
                                            </div>

                                            {/* Room details */}
                                            <div style={{ flex: 1, padding: "20px 24px" }}>
                                                <h3 style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.01em", marginBottom: 4 }}>{room.name}</h3>
                                                <p style={{ fontSize: 13, color: tokens.inkTertiary, marginBottom: 12 }}>
                                                    Hasta {room.max_occupancy} huéspedes
                                                </p>

                                                {room.description && (
                                                    <p style={{ fontSize: 13, color: tokens.inkSecondary, lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                        {room.description}
                                                    </p>
                                                )}

                                                {/* Amenities */}
                                                {room.amenities?.length > 0 && (
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                                        {room.amenities.slice(0, 5).map((a) => (
                                                            <span key={a} style={styles.badge}>
                                                                {amenityIcons[a.toLowerCase()] ?? <Star size={11} />}
                                                                {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Horizon divider */}
                                                <div style={{ ...styles.horizonLine, marginBottom: 16 }} />

                                                {/* Rate plans */}
                                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                    {room.rates.map((rate) => (
                                                        <div key={rate.rate_plan_id} style={{
                                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                                            padding: "10px 14px", borderRadius: tokens.radiusSm,
                                                            border: `1px solid ${tokens.coralLight}`,
                                                            transition: "all 0.15s ease",
                                                            cursor: "pointer",
                                                        }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.coral; e.currentTarget.style.background = tokens.sand; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.background = "transparent"; }}>
                                                            <div>
                                                                <div style={{ fontSize: 14, fontWeight: 550 }}>{rate.rate_plan_name}</div>
                                                                <div style={{ fontSize: 12, color: tokens.inkTertiary }}>{nights} noche{nights !== 1 ? "s" : ""}</div>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                                                <div style={{ textAlign: "right" }}>
                                                                    <div style={{ fontSize: 20, fontWeight: 700, color: tokens.terracotta, letterSpacing: "-0.02em" }}>
                                                                        {cur}{rate.total}
                                                                    </div>
                                                                    <div style={{ fontSize: 11, color: tokens.inkMuted }}>total</div>
                                                                </div>
                                                                <button style={styles.btnSelect} onClick={() => handleSelectRoom(room, rate)}>
                                                                    Reservar <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ STEP 3: GUEST DETAILS ════════════════════════ */}
                {step === "details" && selectedRoom && selectedRate && (
                    <div>
                        <button style={styles.btnGhost} onClick={() => setStep("results")}>
                            <ArrowLeft size={15} /> Volver a habitaciones
                        </button>

                        {/* Progress hint */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 24px" }}>
                            {["Búsqueda", "Selección", "Datos", "Confirmación"].map((s, i) => (
                                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 600,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        background: i <= 2 ? tokens.ocean : tokens.sandDark,
                                        color: i <= 2 ? "#fff" : tokens.inkMuted,
                                    }}>{i + 1}</div>
                                    <span style={{ fontSize: 12, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? tokens.ink : tokens.inkTertiary }}>{s}</span>
                                    {i < 3 && <div style={{ width: 20, height: 1, background: tokens.coralLight }} />}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
                            {/* Guest form */}
                            <div style={{ ...styles.card, padding: 28 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 650, marginBottom: 20, letterSpacing: "-0.01em" }}>Datos del Huésped</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={styles.label}>Nombre *</label>
                                        <input style={styles.input} placeholder="Juan" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)}
                                            onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Apellido *</label>
                                        <input style={styles.input} placeholder="Pérez" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)}
                                            onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }} />
                                    </div>
                                    <div>
                                        <label style={styles.label}><Mail size={13} /> Email *</label>
                                        <input type="email" style={styles.input} placeholder="juan@ejemplo.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                                            onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }} />
                                    </div>
                                    <div>
                                        <label style={styles.label}><Phone size={13} /> Teléfono</label>
                                        <input type="tel" style={styles.input} placeholder="+1 809-555-0100" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                                            onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                            onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <label style={styles.label}>Solicitudes especiales</label>
                                    <textarea
                                        style={{ ...styles.input, minHeight: 80, resize: "none" as const }}
                                        placeholder="Piso alto, cama adicional, late checkout..."
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = tokens.ocean; e.currentTarget.style.boxShadow = `0 0 0 3px hsla(200, 65%, 30%, 0.1)`; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = tokens.coralLight; e.currentTarget.style.boxShadow = "none"; }}
                                    />
                                </div>

                                <div style={{ marginTop: 24 }}>
                                    <button
                                        onClick={handleReserve}
                                        disabled={loading || !guestFirstName || !guestLastName || !guestEmail}
                                        style={{ ...styles.btnConfirm, opacity: (loading || !guestFirstName || !guestLastName || !guestEmail) ? 0.5 : 1 }}
                                    >
                                        {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={18} />}
                                        Confirmar Reserva
                                    </button>
                                </div>
                            </div>

                            {/* Booking summary sidebar */}
                            <div style={{ ...styles.card, padding: 24, position: "sticky" as const, top: 80 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 650, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.04em", color: tokens.inkSecondary }}>
                                    Resumen
                                </h4>

                                <div style={{ padding: 14, borderRadius: tokens.radiusSm, background: tokens.oceanPale, marginBottom: 16 }}>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedRoom.name}</div>
                                    <div style={{ fontSize: 12, color: tokens.inkTertiary, marginTop: 2 }}>{selectedRate.rate_plan_name}</div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                                    {[
                                        ["Llegada", checkIn],
                                        ["Salida", checkOut],
                                        ["Noches", String(nights)],
                                        ["Huéspedes", `${adults} adulto${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} niño${children !== 1 ? "s" : ""}` : ""}`],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: tokens.inkTertiary }}>{k}</span>
                                            <span style={{ fontWeight: 550 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Horizon line */}
                                <div style={{ ...styles.horizonLine, margin: "16px 0" }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: 650, fontSize: 16 }}>Total</span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: tokens.terracotta, letterSpacing: "-0.02em" }}>
                                        {cur}{selectedRate.total}
                                    </span>
                                </div>

                                <p style={{ fontSize: 11, color: tokens.inkMuted, marginTop: 8 }}>
                                    Impuestos incluidos · Check-in: {hotel.check_in_time}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 4: CONFIRMATION ═════════════════════════ */}
                {step === "confirmation" && confirmation && (
                    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 0" }}>
                        {/* Success */}
                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: "50%",
                                background: tokens.tropicalPale,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 16px",
                            }}>
                                <CheckCircle2 size={36} color={tokens.tropical} />
                            </div>
                            <h2 style={{ fontSize: 28, fontWeight: 700, color: tokens.tropical, letterSpacing: "-0.02em", marginBottom: 8 }}>
                                ¡Reserva Confirmada!
                            </h2>
                            <p style={{ fontSize: 14, color: tokens.inkTertiary, lineHeight: 1.5 }}>
                                Hemos asegurado tu estancia. Recibirás un email de confirmación.
                            </p>
                        </div>

                        {/* Confirmation card */}
                        <div style={{ ...styles.card, padding: 32, boxShadow: tokens.shadowXl }}>
                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                <div style={{ fontSize: 11, fontWeight: 500, color: tokens.inkTertiary, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
                                    Código de Confirmación
                                </div>
                                <div style={{
                                    fontSize: 36, fontWeight: 700, letterSpacing: "0.12em",
                                    color: tokens.ocean,
                                    fontFamily: "'DM Sans', monospace",
                                }}>
                                    {confirmation.confirmation_code}
                                </div>
                            </div>

                            <div style={{ ...styles.horizonLine, margin: "0 0 24px" }} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Hotel</div>
                                    <div style={{ fontWeight: 600 }}>{confirmation.hotel_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Estado</div>
                                    <span style={{
                                        display: "inline-flex", padding: "3px 10px", borderRadius: 16,
                                        fontSize: 12, fontWeight: 600,
                                        background: tokens.tropicalPale, color: tokens.tropical,
                                    }}>{confirmation.status}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Check-in</div>
                                    <div style={{ fontWeight: 600 }}>{confirmation.check_in} · {confirmation.check_in_time}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Check-out</div>
                                    <div style={{ fontWeight: 600 }}>{confirmation.check_out}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: tokens.inkMuted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Total</div>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: tokens.terracotta }}>{cur}{confirmation.total}</div>
                                </div>
                            </div>

                            <div style={{ ...styles.horizonLine, margin: "24px 0 16px" }} />

                            <div style={{ textAlign: "center", fontSize: 12, color: tokens.inkTertiary }}>
                                {confirmation.hotel_phone && <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}><Phone size={12} /> {confirmation.hotel_phone}</p>}
                                {confirmation.hotel_email && <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Mail size={12} /> {confirmation.hotel_email}</p>}
                            </div>
                        </div>

                        <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button style={{ ...styles.btnGhost, fontSize: 14, color: tokens.ocean }} onClick={() => {
                                setStep("search"); setSelectedRoom(null); setSelectedRate(null); setConfirmation(null);
                                setGuestFirstName(""); setGuestLastName(""); setGuestEmail(""); setGuestPhone(""); setSpecialRequests("");
                            }}>
                                Hacer otra reserva
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Footer ───────────────────────────────────────── */}
            <footer style={{
                borderTop: `1px solid ${tokens.coralLight}`,
                padding: "20px 24px",
                textAlign: "center" as const,
                fontSize: 12,
                color: tokens.inkMuted,
                background: `linear-gradient(180deg, transparent, ${tokens.sand})`,
            }}>
                <p>
                    Powered by <span style={{ fontWeight: 600, color: tokens.ocean }}>HotelMate</span> · Reservations Engine
                </p>
                <p style={{ marginTop: 4 }}>
                    © {new Date().getFullYear()} {hotel.name}
                </p>
            </footer>

            {/* Responsive overrides */}
            <style>{`
        @media (max-width: 768px) {
          [style*="gridTemplateColumns: 1fr 340px"] { grid-template-columns: 1fr !important; }
          [style*="width: 240"] { width: 100% !important; height: 180px !important; }
          [style*="flexDirection: row"] { flex-direction: column !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: opacity(0.5); cursor: pointer; }
        ::selection { background: hsla(200, 65%, 30%, 0.15); }
      `}</style>
        </div>
    );
}
