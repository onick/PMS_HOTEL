// ===========================================
// CONFIRM RESERVATION PAYMENT
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Initialize Stripe
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Validation schema
const ConfirmPaymentSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
  paymentMethod: z.string().optional(),
  paymentIntentId: z.string().optional(), // Stripe Payment Intent ID
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
    console.log('💳 Confirm reservation payment request received');

    // Validate request body
    const body = await req.json();
    const input = validateRequest(ConfirmPaymentSchema, body);

    console.log(`✅ Validated reservation ID: ${input.reservationId}`);

    const supabase = getSupabaseServiceClient();

    // Fetch reservation with folio
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, folios(id, balance_cents)")
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
    if (reservation.status !== "PENDING_PAYMENT") {
      console.warn(`⚠️ Invalid status: ${reservation.status}, expected PENDING_PAYMENT`);
      return createCorsResponse(
        {
          error: 'Invalid reservation status',
          details: `Expected PENDING_PAYMENT, got ${reservation.status}`
        },
        409, // Conflict
        origin
      );
    }

    console.log(`📅 Processing ${reservation.check_in} to ${reservation.check_out}`);

    const days = enumerateDates(reservation.check_in, reservation.check_out);

    // Convert holds to reserved inventory
    for (const day of days) {
      // Release hold
      const { error: holdError } = await supabase.rpc("increment_inventory_holds", {
        p_hotel_id: reservation.hotel_id,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: -1,
      });

      if (holdError) {
        console.error(`❌ Hold release error on ${day}: ${holdError.message}`);
        return createCorsResponse(
          {
            error: 'Failed to release inventory hold',
            details: holdError.message,
            day
          },
          500,
          origin
        );
      }

      // Increment reserved
      const { error: reservedError } = await supabase.rpc("increment_inventory_reserved", {
        p_hotel_id: reservation.hotel_id,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: 1,
      });

      if (reservedError) {
        console.error(`❌ Reserved increment error on ${day}: ${reservedError.message}`);
        return createCorsResponse(
          {
            error: 'Failed to increment reserved inventory',
            details: reservedError.message,
            day
          },
          500,
          origin
        );
      }
    }

    console.log('✅ Inventory converted from holds to reserved');

    // Update reservation status to CONFIRMED
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "CONFIRMED",
        hold_expires_at: null,
        metadata: {
          ...reservation.metadata,
          payment_confirmed_at: new Date().toISOString(),
          payment_method: input.paymentMethod,
        },
      })
      .eq("id", input.reservationId);

    if (updateError) {
      console.error(`❌ Reservation update error: ${updateError.message}`);
      return createCorsResponse(
        {
          error: 'Failed to update reservation',
          details: updateError.message
        },
        500,
        origin
      );
    }

    console.log('✅ Reservation status updated to CONFIRMED');

    // Create folio charges and update balance
    const folioId = reservation.folios?.[0]?.id;
    if (folioId) {
      // Create charge in folio_charges (FIXED: was folio_line_items)
      const { error: chargeError } = await supabase
        .from("folio_charges")
        .insert({
          folio_id: folioId,
          description: `Hospedaje ${days.length} ${days.length === 1 ? "noche" : "noches"}`,
          amount_cents: reservation.total_amount_cents,
          charge_date: reservation.check_in, // FIXED: Use check_in date instead of current date
        });

      if (chargeError) {
        console.warn(`⚠️ Charge creation warning: ${chargeError.message}`);
      } else {
        console.log('✅ Folio charge created');
      }

      // Update folio balance
      const { error: folioError } = await supabase.rpc("update_folio_balance", {
        p_folio_id: folioId,
        p_amount_cents: reservation.total_amount_cents,
      });

      if (folioError) {
        console.warn(`⚠️ Folio balance update warning: ${folioError.message}`);
      } else {
        console.log('✅ Folio balance updated');
      }

      // Save Stripe payment details if payment_intent_id exists
      const paymentIntentId = input.paymentIntentId || reservation.payment_intent_id;

      if (paymentIntentId && stripe) {
        try {
          console.log(`💳 Retrieving Payment Intent: ${paymentIntentId}`);

          // Fetch payment intent from Stripe
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

          // Extract payment method details
          let paymentMethodDetails: any = {};
          if (paymentIntent.latest_charge) {
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
            paymentMethodDetails = {
              type: charge.payment_method_details?.type,
              brand: charge.payment_method_details?.card?.brand,
              last4: charge.payment_method_details?.card?.last4,
            };
          }

          // Save to stripe_payments table
          const { error: paymentError } = await supabase
            .from("stripe_payments")
            .insert({
              folio_id: folioId,
              hotel_id: reservation.hotel_id,
              stripe_payment_intent_id: paymentIntent.id,
              stripe_customer_id: paymentIntent.customer as string || null,
              stripe_charge_id: paymentIntent.latest_charge as string || null,
              amount_cents: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase(),
              status: paymentIntent.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
              payment_method_type: paymentMethodDetails.type || input.paymentMethod || 'card',
              payment_method_brand: paymentMethodDetails.brand || null,
              payment_method_last4: paymentMethodDetails.last4 || null,
              description: `Payment for reservation ${reservation.id}`,
              receipt_email: paymentIntent.receipt_email || null,
              metadata: {
                reservation_id: reservation.id,
                customer: reservation.customer,
              },
              paid_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
            });

          if (paymentError) {
            console.error(`❌ Failed to save payment details: ${paymentError.message}`);
          } else {
            console.log('✅ Stripe payment details saved to database');
          }
        } catch (stripeError: any) {
          console.error(`❌ Stripe API error: ${stripeError.message}`);
        }
      } else if (paymentIntentId && !stripe) {
        console.warn('⚠️ Stripe not configured, skipping payment details save');
      }
    }

    console.log('✅ Payment confirmation completed successfully');

    return createCorsResponse(
      {
        success: true,
        reservationId: input.reservationId,
        status: "CONFIRMED",
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
