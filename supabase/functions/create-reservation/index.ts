// ===========================================
// CREATE RESERVATION WITH INVENTORY HOLDS
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const CreateReservationSchema = z.object({
  idempotencyKey: z.string().min(1, 'Idempotency key required'),
  hotelId: z.string().uuid('Invalid hotel ID'),
  roomTypeId: z.string().uuid('Invalid room type ID'),
  checkIn: z.string().datetime('Invalid check-in date'),
  checkOut: z.string().datetime('Invalid check-out date'),
  guests: z.number().int().min(1).max(20),
  guestBreakdown: z.object({
    adults: z.number().int().min(0).max(20),
    children: z.number().int().min(0).max(20),
    infants: z.number().int().min(0).max(20),
  }).optional(),
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
  }),
  ratePlanId: z.string().uuid('Invalid rate plan ID'),
  currency: z.enum(['DOP', 'USD']),
  payment: z.object({
    strategy: z.enum(['stripe_intent', 'pay_at_hotel']),
    paymentIntentId: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

interface CreateReservationResult {
  reservationId: string;
  status: "PENDING_PAYMENT" | "CONFIRMED";
  folioId: string;
  holdExpiresAt?: string;
}

// Validate request helper
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('🏨 Create reservation request received');

    // Validate request body
    const body = await req.json();
    const input = validateRequest(CreateReservationSchema, body);

    console.log(`✅ Validated reservation for hotel: ${input.hotelId}`);

    const supabase = getSupabaseServiceClient();

    // ===== (0) IDEMPOTENCY =====
    const { data: idemData } = await supabase
      .from("idempotency_keys")
      .select("response")
      .eq("hotel_id", input.hotelId)
      .eq("key", input.idempotencyKey)
      .maybeSingle();

    if (idemData) {
      console.log('🔄 Returning cached response (idempotent)');
      return createCorsResponse(idemData.response, 200, origin);
    }

    // ===== (1) VALIDATE DATES =====
    const days = enumerateDates(input.checkIn, input.checkOut);
    if (days.length === 0) {
      throw new Error('Invalid dates: check_in must be before check_out');
    }

    console.log(`📅 Nights: ${days.length}, Days: ${days.join(", ")}`);

    // ===== (2) CALCULATE PRICE (revalidated) =====
    const { data: roomType, error: roomTypeError } = await supabase
      .from("room_types")
      .select("base_price_cents")
      .eq("id", input.roomTypeId)
      .eq("hotel_id", input.hotelId)
      .single();

    if (roomTypeError || !roomType) {
      console.error(`❌ Room type not found: ${input.roomTypeId}`);
      return createCorsResponse(
        { error: 'Room type not found' },
        404,
        origin
      );
    }

    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("tax_rate, currency")
      .eq("id", input.hotelId)
      .single();

    if (hotelError || !hotel) {
      console.error(`❌ Hotel not found: ${input.hotelId}`);
      return createCorsResponse(
        { error: 'Hotel not found' },
        404,
        origin
      );
    }

    // Base: price_per_night * num_nights
    const baseAmountCents = roomType.base_price_cents * days.length;
    // Apply tax (e.g., 18% ITBIS in Dominican Republic)
    const taxAmountCents = Math.round(baseAmountCents * hotel.tax_rate);
    const totalAmountCents = baseAmountCents + taxAmountCents;

    console.log(`💰 Pricing: base=${baseAmountCents}, tax=${taxAmountCents}, total=${totalAmountCents}`);

    // ===== (3) LOCK INVENTORY & VERIFY AVAILABILITY =====
    for (const day of days) {
      const { data: invRow, error: invError } = await supabase
        .from("inventory_by_day")
        .select("total, reserved, holds")
        .eq("hotel_id", input.hotelId)
        .eq("room_type_id", input.roomTypeId)
        .eq("day", day)
        .single();

      if (invError || !invRow) {
        console.error(`❌ No inventory row for day: ${day}`);
        return createCorsResponse(
          { error: `No inventory configured for ${day}` },
          500,
          origin
        );
      }

      const available = invRow.total - invRow.reserved - invRow.holds;
      if (available <= 0) {
        console.warn(`⚠️ Sold out on ${day}`);
        return createCorsResponse(
          {
            error: 'Room sold out',
            details: `No availability on ${day}`
          },
          409, // Conflict
          origin
        );
      }
    }

    console.log('✅ Inventory available for all days');

    // ===== (4) CREATE RESERVATION + FOLIO + APPLY HOLDS =====
    const reservationId = crypto.randomUUID();
    const folioId = crypto.randomUUID();
    const holdMinutes = input.payment?.strategy === "stripe_intent" ? 20 : 60;
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();

    console.log(`⏱️ Hold expires in ${holdMinutes} minutes: ${holdExpiresAt}`);

    // Create folio
    const { error: folioError } = await supabase.from("folios").insert({
      id: folioId,
      hotel_id: input.hotelId,
      reservation_id: reservationId,
      currency: input.currency,
      balance_cents: 0,
    });

    if (folioError) {
      console.error(`❌ Folio insert error: ${folioError.message}`);
      return createCorsResponse(
        { error: 'Failed to create folio', details: folioError.message },
        500,
        origin
      );
    }

    // Create reservation
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
      metadata: {
        ...input.metadata,
        guestBreakdown: input.guestBreakdown,
      },
    });

    if (resError) {
      console.error(`❌ Reservation insert error: ${resError.message}`);
      return createCorsResponse(
        { error: 'Failed to create reservation', details: resError.message },
        500,
        origin
      );
    }

    console.log(`✅ Reservation created: ${reservationId}`);

    // Apply holds on inventory
    for (const day of days) {
      const { error: holdError } = await supabase.rpc("increment_inventory_holds", {
        p_hotel_id: input.hotelId,
        p_room_type_id: input.roomTypeId,
        p_day: day,
        p_delta: 1,
      });

      if (holdError) {
        console.error(`❌ Hold increment error on ${day}: ${holdError.message}`);
        // TODO: Implement proper rollback/compensation
        return createCorsResponse(
          {
            error: 'Failed to apply inventory hold',
            details: holdError.message,
            day
          },
          500,
          origin
        );
      }
    }

    console.log('✅ Inventory holds applied');

    const response: CreateReservationResult = {
      reservationId,
      status: "PENDING_PAYMENT",
      folioId,
      holdExpiresAt,
    };

    // Save idempotent response
    await supabase.from("idempotency_keys").insert({
      hotel_id: input.hotelId,
      key: input.idempotencyKey,
      response,
    });

    console.log('✅ Reservation completed successfully');

    return createCorsResponse(response, 200, origin);

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);

    // Validation errors return 400, others return 500
    const status = error.message.includes('Validation failed') ? 400 : 500;

    return createCorsResponse(
      { error: error.message || 'Internal error' },
      status,
      origin
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
