// ===========================================
// CHECK-IN GUEST TO ROOM
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const CheckInSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
  roomId: z.string().uuid('Invalid room ID'),
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
    console.log('🔑 Check-in request received');

    // Validate request body
    const body = await req.json();
    const input = validateRequest(CheckInSchema, body);

    console.log(`✅ Validated check-in for reservation: ${input.reservationId}`);

    const supabase = getSupabaseServiceClient();

    // ===== (1) VALIDATE RESERVATION =====
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
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
    if (reservation.status !== "CONFIRMED") {
      console.warn(`⚠️ Invalid status: ${reservation.status}, expected CONFIRMED`);
      return createCorsResponse(
        {
          error: 'Invalid reservation status',
          details: `Reservation must be CONFIRMED, current: ${reservation.status}`
        },
        409, // Conflict
        origin
      );
    }

    // Validate check-in date
    const today = new Date().toISOString().split("T")[0];
    if (reservation.check_in !== today) {
      console.warn(`⚠️ Check-in date mismatch: today=${today}, reservation=${reservation.check_in}`);
      return createCorsResponse(
        {
          error: 'Invalid check-in date',
          details: `Expected ${today}, reservation check-in: ${reservation.check_in}`
        },
        400,
        origin
      );
    }

    console.log(`📅 Check-in date validated: ${today}`);

    // ===== (2) VALIDATE ROOM =====
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", input.roomId)
      .eq("hotel_id", reservation.hotel_id)
      .eq("room_type_id", reservation.room_type_id)
      .single();

    if (roomError || !room) {
      console.error(`❌ Room not found or type mismatch: ${input.roomId}`);
      return createCorsResponse(
        { error: 'Room not found or room type mismatch' },
        404,
        origin
      );
    }

    if (room.status !== "AVAILABLE") {
      console.warn(`⚠️ Room not available: ${room.status}`);
      return createCorsResponse(
        {
          error: 'Room not available',
          details: `Room status: ${room.status}`
        },
        409, // Conflict
        origin
      );
    }

    console.log(`✅ Room validated: ${room.room_number} (${room.status})`);

    // ===== (3) EXECUTE CHECK-IN =====
    // Update reservation status
    const { error: updateResError } = await supabase
      .from("reservations")
      .update({
        status: "CHECKED_IN",
        room_id: input.roomId,
        metadata: {
          ...reservation.metadata,
          checked_in_at: new Date().toISOString(),
          assigned_room_number: room.room_number,
          check_in_notes: input.notes || null,
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

    console.log('✅ Reservation updated to CHECKED_IN');

    // Update room status to OCCUPIED
    const { error: updateRoomError } = await supabase
      .from("rooms")
      .update({ status: "OCCUPIED" })
      .eq("id", input.roomId);

    if (updateRoomError) {
      console.error(`❌ Room update error: ${updateRoomError.message}`);
      return createCorsResponse(
        {
          error: 'Failed to update room status',
          details: updateRoomError.message
        },
        500,
        origin
      );
    }

    console.log('✅ Room updated to OCCUPIED');

    // Create room lock (physical room assignment)
    const { error: lockError } = await supabase
      .from("room_locks")
      .insert({
        hotel_id: reservation.hotel_id,
        room_id: input.roomId,
        day: today,
        reservation_id: input.reservationId,
      });

    if (lockError) {
      console.warn(`⚠️ Room lock creation warning (non-critical): ${lockError.message}`);
    } else {
      console.log('✅ Room lock created');
    }

    console.log('✅ Check-in completed successfully');

    return createCorsResponse(
      {
        success: true,
        reservationId: input.reservationId,
        roomNumber: room.room_number,
        status: "CHECKED_IN",
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
