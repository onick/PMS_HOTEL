import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const ConfirmPaymentSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
  reservationId: z.string().uuid('Invalid reservation ID'),
  paymentIntentId: z.string().min(1, 'Payment intent ID required'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    // Parse and validate input
    const body = await req.json();
    const result = ConfirmPaymentSchema.safeParse(body);

    if (!result.success) {
      return createCorsResponse(
        { error: 'Validation failed', details: result.error.flatten() },
        400,
        origin
      );
    }

    const input = result.data;
    const supabase = getSupabaseServiceClient();

    console.log('Confirming payment:', input);

    // TODO: Verify Stripe payment succeeded
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    // const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
    // if (paymentIntent.status !== 'succeeded') {
    //   throw new Error('Payment not confirmed');
    // }

    // Get reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, room_types(id)')
      .eq('id', input.reservationId)
      .eq('hotel_id', input.hotelId)
      .single();

    if (resError || !reservation) {
      return createCorsResponse(
        { error: 'Reservation not found' },
        404,
        origin
      );
    }

    if (reservation.status !== 'PENDING_PAYMENT') {
      return createCorsResponse(
        { message: 'Already processed', status: reservation.status },
        200,
        origin
      );
    }

    // Verify hold hasn't expired
    const holdExpiresAt = new Date(reservation.hold_expires_at);
    if (holdExpiresAt < new Date()) {
      return createCorsResponse(
        { error: 'Hold expired, please create a new reservation' },
        400,
        origin
      );
    }

    // Convert holds to reserved
    const days = enumerateDates(reservation.check_in, reservation.check_out);

    for (const day of days) {
      // Decrement holds
      await supabase.rpc('increment_inventory_holds', {
        p_hotel_id: input.hotelId,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: -1,
      });

      // Increment reserved
      await supabase.rpc('increment_inventory_reserved', {
        p_hotel_id: input.hotelId,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: 1,
      });
    }

    // Update reservation status
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'CONFIRMED',
        hold_expires_at: null,
      })
      .eq('id', input.reservationId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update reservation: ${updateError.message}`);
    }

    console.log('Payment confirmed successfully');

    return createCorsResponse(
      { 
        message: 'Payment confirmed', 
        reservationId: input.reservationId,
        status: 'CONFIRMED'
      },
      200,
      origin
    );

  } catch (error) {
    console.error('Error confirming payment:', error);
    return createCorsResponse(
      { error: error.message || 'Internal server error' },
      500,
      origin
    );
  }
});

// Helper function to enumerate dates
function enumerateDates(checkIn: string, checkOut: string): string[] {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) return [];

    const days: string[] = [];
    const current = new Date(start);

    while (current < end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return days;
  } catch {
    return [];
  }
}
