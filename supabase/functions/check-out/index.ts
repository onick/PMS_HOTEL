// ===========================================
// CHECK-OUT GUEST FROM ROOM
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const CheckOutSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
  notes: z.string().optional(),
});

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
    console.log('👋 Check-out request received');

    // Validate request body
    const body = await req.json();
    const input = validateRequest(CheckOutSchema, body);

    console.log(`✅ Validated check-out for reservation: ${input.reservationId}`);

    const supabase = getSupabaseServiceClient();

    // ===== (1) VALIDATE RESERVATION =====
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, folios(*)")
      .eq("id", input.reservationId)
      .single();

    if (resError || !reservation) {
      console.error(`❌ Reservation not found: ${input.reservationId}`);
      return createCorsResponse(
        { error: 'Reservation not found' },
        404,
        origin
      );
    }

    // Validate reservation status
    if (reservation.status !== "CHECKED_IN") {
      console.warn(`⚠️ Invalid status: ${reservation.status}, expected CHECKED_IN`);
      return createCorsResponse(
        {
          error: 'Invalid reservation status',
          details: `Reservation must be CHECKED_IN, current: ${reservation.status}`
        },
        409, // Conflict
        origin
      );
    }

    console.log(`✅ Reservation status validated: ${reservation.status}`);

    // ===== (2) VERIFY FOLIO BALANCE =====
    const folio = reservation.folios;
    if (!folio) {
      console.error('❌ Folio not found');
      return createCorsResponse(
        { error: 'Folio not found' },
        500,
        origin
      );
    }

    if (folio.balance_cents > 0) {
      const balanceDisplay = (folio.balance_cents / 100).toFixed(2);
      console.warn(`⚠️ Unpaid balance: ${balanceDisplay}`);
      return createCorsResponse(
        {
          error: 'Unpaid balance',
          details: `Balance pending: $${balanceDisplay}`,
          balanceCents: folio.balance_cents
        },
        402, // Payment Required
        origin
      );
    }

    console.log('✅ Folio balance is zero, can proceed');

    // ===== (3) EXECUTE CHECK-OUT =====
    // Update reservation status
    const { error: updateResError } = await supabase
      .from("reservations")
      .update({
        status: "CHECKED_OUT",
        metadata: {
          ...reservation.metadata,
          checked_out_at: new Date().toISOString(),
          check_out_notes: input.notes || null,
        },
      })
      .eq("id", input.reservationId);

    if (updateResError) {
      console.error(`❌ Reservation update error: ${updateResError.message}`);
      return createCorsResponse(
        {
          error: 'Failed to update reservation',
          details: updateResError.message
        },
        500,
        origin
      );
    }

    console.log('✅ Reservation updated to CHECKED_OUT');

    // Release room (set to MAINTENANCE for cleaning)
    if (reservation.room_id) {
      const { error: updateRoomError } = await supabase
        .from("rooms")
        .update({ status: "MAINTENANCE" })
        .eq("id", reservation.room_id);

      if (updateRoomError) {
        console.warn(`⚠️ Room update warning (non-critical): ${updateRoomError.message}`);
      } else {
        console.log('✅ Room set to MAINTENANCE for cleaning');
      }
    }

    console.log('✅ Check-out completed successfully');

    return createCorsResponse(
      {
        success: true,
        reservationId: input.reservationId,
        status: "CHECKED_OUT",
        finalBalance: folio.balance_cents,
      },
      200,
      origin
    );

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
