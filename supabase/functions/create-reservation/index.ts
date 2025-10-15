import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateReservationInput {
  idempotencyKey: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  customer: { name: string; email: string; phone?: string };
  ratePlanId: string;
  currency: "DOP" | "USD";
  payment?: { strategy: "stripe_intent" | "pay_at_hotel"; paymentIntentId?: string };
  metadata?: Record<string, any>;
}

interface CreateReservationResult {
  reservationId: string;
  status: "PENDING_PAYMENT" | "CONFIRMED";
  folioId: string;
  holdExpiresAt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const input: CreateReservationInput = await req.json();
    console.log("Creating reservation:", input);

    // ===== (0) IDEMPOTENCIA =====
    const { data: idemData } = await supabase
      .from("idempotency_keys")
      .select("response")
      .eq("hotel_id", input.hotelId)
      .eq("key", input.idempotencyKey)
      .maybeSingle();

    if (idemData) {
      console.log("Returning cached response (idempotent)");
      return new Response(JSON.stringify(idemData.response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== (1) VALIDAR FECHAS =====
    const days = enumerateDates(input.checkIn, input.checkOut);
    if (days.length === 0) {
      throw new Error("InvalidDates: check_in debe ser antes de check_out");
    }

    console.log(`Nights: ${days.length}, Days: ${days.join(", ")}`);

    // ===== (2) CALCULAR PRECIO (revalidado) =====
    const { data: roomType } = await supabase
      .from("room_types")
      .select("base_price_cents")
      .eq("id", input.roomTypeId)
      .eq("hotel_id", input.hotelId)
      .single();

    if (!roomType) {
      throw new Error("RoomTypeNotFound");
    }

    const { data: hotel } = await supabase
      .from("hotels")
      .select("tax_rate, currency")
      .eq("id", input.hotelId)
      .single();

    if (!hotel) {
      throw new Error("HotelNotFound");
    }

    // Base: precio_noche * num_noches
    const baseAmountCents = roomType.base_price_cents * days.length;
    // Aplicar ITBIS (tax_rate, ej: 18% en RD)
    const taxAmountCents = Math.round(baseAmountCents * hotel.tax_rate);
    const totalAmountCents = baseAmountCents + taxAmountCents;

    console.log(`Pricing: base=${baseAmountCents}, tax=${taxAmountCents}, total=${totalAmountCents}`);

    // ===== (3) LOCK INVENTARIO Y VERIFICAR CUPOS =====
    for (const day of days) {
      const { data: invRow, error: invError } = await supabase
        .from("inventory_by_day")
        .select("total, reserved, holds")
        .eq("hotel_id", input.hotelId)
        .eq("room_type_id", input.roomTypeId)
        .eq("day", day)
        .single();

      if (invError || !invRow) {
        throw new Error(`NoInventoryRow: ${day}`);
      }

      const available = invRow.total - invRow.reserved - invRow.holds;
      if (available <= 0) {
        throw new Error(`SoldOut: ${day} (${invRow.total} total, ${invRow.reserved} reserved, ${invRow.holds} holds)`);
      }
    }

    // ===== (4) CREAR RESERVA + FOLIO + APLICAR HOLDS =====
    const reservationId = crypto.randomUUID();
    const folioId = crypto.randomUUID();
    const holdMinutes = input.payment?.strategy === "stripe_intent" ? 20 : 60;
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();

    // Crear folio
    const { error: folioError } = await supabase.from("folios").insert({
      id: folioId,
      hotel_id: input.hotelId,
      reservation_id: reservationId,
      currency: input.currency,
      balance_cents: 0,
    });

    if (folioError) {
      throw new Error(`FolioInsertError: ${folioError.message}`);
    }

    // Crear reserva
    const { error: resError } = await supabase.from("reservations").insert({
      id: reservationId,
      hotel_id: input.hotelId,
      room_type_id: input.roomTypeId,
      rate_plan_id: input.ratePlanId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: input.guests,
      status: "PENDING_PAYMENT",
      customer: input.customer,
      currency: input.currency,
      total_amount_cents: totalAmountCents,
      folio_id: folioId,
      hold_expires_at: holdExpiresAt,
      payment_intent_id: input.payment?.paymentIntentId || null,
      metadata: input.metadata || {},
    });

    if (resError) {
      throw new Error(`ReservationInsertError: ${resError.message}`);
    }

    // Aplicar holds en inventario
    for (const day of days) {
      const { error: holdError } = await supabase.rpc("increment_inventory_holds", {
        p_hotel_id: input.hotelId,
        p_room_type_id: input.roomTypeId,
        p_day: day,
        p_delta: 1,
      });

      if (holdError) {
        // Rollback manual (compensación)
        console.error("Error incrementing holds, attempting rollback:", holdError);
        // En producción: intentar revertir
        throw new Error(`HoldIncrementError: ${holdError.message}`);
      }
    }

    const response: CreateReservationResult = {
      reservationId,
      status: "PENDING_PAYMENT",
      folioId,
      holdExpiresAt,
    };

    // Guardar respuesta idempotente
    await supabase.from("idempotency_keys").insert({
      hotel_id: input.hotelId,
      key: input.idempotencyKey,
      response,
    });

    console.log("Reservation created successfully:", response);

    // ===== (5) POST-COMMIT (opcional: webhook/queue) =====
    // En producción: enqueue job para confirmar pago, enviar emails, etc.

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "InternalError" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// ===== HELPERS =====
function enumerateDates(checkIn: string, checkOut: string): string[] {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) return [];

    const days: string[] = [];
    const current = new Date(start);

    while (current < end) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    return days;
  } catch {
    return [];
  }
}