// ===========================================
// STRIPE PAYMENT INTENT WEBHOOK
// Handles payment_intent events and saves to stripe_payments
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { captureError, isSentryConfigured } from '../_shared/sentry.ts';

// Validate environment variables on startup
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const WEBHOOK_SECRET = Deno.env.get("STRIPE_PAYMENT_WEBHOOK_SECRET");

if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables: STRIPE_SECRET_KEY or STRIPE_PAYMENT_WEBHOOK_SECRET');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Log monitoring status on startup
if (isSentryConfigured()) {
  console.log('✅ Sentry error tracking enabled');
} else {
  console.log('⚠️ Sentry not configured - errors will only be logged locally');
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error('❌ Missing Stripe signature header');
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);

    console.log(`✅ Verified webhook event: ${event.type}`);

    const supabase = getSupabaseServiceClient();

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object, supabase, stripe);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object, supabase);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);

    // Capture error in Sentry
    await captureError(err, {
      functionName: 'stripe-payment-webhook',
      extra: {
        errorType: err.type,
        errorCode: err.code,
      },
    });
    
    // Return 400 for signature verification failures
    if (err.message.includes('signature')) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return 500 for other errors (Stripe will retry)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ===========================================
// HANDLER: payment_intent.succeeded
// ===========================================
async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any, stripe: Stripe) {
  try {
    console.log(`💳 Processing payment_intent.succeeded: ${paymentIntent.id}`);

    // Check if payment already exists (idempotency)
    const { data: existing } = await supabase
      .from("stripe_payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (existing) {
      console.log('ℹ️  Payment already recorded, skipping');
      return;
    }

    // Find reservation by payment_intent_id
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, folios(id)")
      .eq("payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (resError || !reservation) {
      console.warn(`⚠️ Reservation not found for payment_intent: ${paymentIntent.id}`);
      // Still save the payment for audit purposes with minimal data
      await savePaymentWithoutReservation(paymentIntent, supabase, stripe);
      return;
    }

    console.log(`✅ Found reservation: ${reservation.id}`);

    // Extract payment method details
    let paymentMethodDetails: any = {};
    if (paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
        paymentMethodDetails = {
          type: charge.payment_method_details?.type,
          brand: charge.payment_method_details?.card?.brand,
          last4: charge.payment_method_details?.card?.last4,
        };
      } catch (chargeError: any) {
        console.warn(`⚠️ Could not retrieve charge details: ${chargeError.message}`);
      }
    }

    const folioId = reservation.folios?.id || reservation.folio_id;

    // Save to stripe_payments table
    const { error: paymentError } = await supabase
      .from("stripe_payments")
      .insert({
        folio_id: folioId,
        hotel_id: reservation.hotel_id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: paymentIntent.customer || null,
        stripe_charge_id: paymentIntent.latest_charge || null,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'SUCCEEDED',
        payment_method_type: paymentMethodDetails.type || 'card',
        payment_method_brand: paymentMethodDetails.brand || null,
        payment_method_last4: paymentMethodDetails.last4 || null,
        description: `Payment for reservation ${reservation.id}`,
        receipt_email: paymentIntent.receipt_email || null,
        receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
        metadata: {
          reservation_id: reservation.id,
          customer: reservation.customer,
          webhook_processed: true,
        },
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
      });

    if (paymentError) {
      console.error(`❌ Failed to save payment: ${paymentError.message}`);
      throw paymentError;
    }

    console.log('✅ Payment saved to stripe_payments table');

  } catch (error: any) {
    console.error(`❌ Error in handlePaymentIntentSucceeded: ${error.message}`);
    throw error;
  }
}

// ===========================================
// HANDLER: payment_intent.payment_failed
// ===========================================
async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  try {
    console.log(`❌ Processing payment_intent.payment_failed: ${paymentIntent.id}`);

    // Check if payment exists
    const { data: existing } = await supabase
      .from("stripe_payments")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (existing) {
      // Update existing payment to FAILED
      const { error: updateError } = await supabase
        .from("stripe_payments")
        .update({
          status: 'FAILED',
          failure_code: paymentIntent.last_payment_error?.code || null,
          failure_message: paymentIntent.last_payment_error?.message || 'Payment failed',
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (updateError) {
        console.error(`❌ Failed to update payment: ${updateError.message}`);
      } else {
        console.log('✅ Payment updated to FAILED status');
      }
    } else {
      // Create new failed payment record
      const { data: reservation } = await supabase
        .from("reservations")
        .select("*, folios(id)")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (reservation) {
        const folioId = reservation.folios?.id || reservation.folio_id;

        const { error: insertError } = await supabase
          .from("stripe_payments")
          .insert({
            folio_id: folioId,
            hotel_id: reservation.hotel_id,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer || null,
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'FAILED',
            failure_code: paymentIntent.last_payment_error?.code || null,
            failure_message: paymentIntent.last_payment_error?.message || 'Payment failed',
            description: `Failed payment for reservation ${reservation.id}`,
            metadata: {
              reservation_id: reservation.id,
              webhook_processed: true,
            },
          });

        if (insertError) {
          console.error(`❌ Failed to save failed payment: ${insertError.message}`);
        } else {
          console.log('✅ Failed payment recorded');
        }
      }
    }
  } catch (error: any) {
    console.error(`❌ Error in handlePaymentIntentFailed: ${error.message}`);
  }
}

// ===========================================
// HANDLER: charge.refunded
// ===========================================
async function handleChargeRefunded(charge: any, supabase: any) {
  try {
    console.log(`🔄 Processing charge.refunded: ${charge.id}`);

    // Find the original payment
    const { data: payment } = await supabase
      .from("stripe_payments")
      .select("*, folios(hotel_id)")
      .eq("stripe_charge_id", charge.id)
      .maybeSingle();

    if (!payment) {
      console.warn(`⚠️ Payment not found for charge: ${charge.id}`);
      return;
    }

    // Process each refund in the charge
    for (const refund of charge.refunds.data) {
      // Check if refund already exists
      const { data: existingRefund } = await supabase
        .from("stripe_refunds")
        .select("id")
        .eq("stripe_refund_id", refund.id)
        .maybeSingle();

      if (existingRefund) {
        console.log(`ℹ️  Refund already recorded: ${refund.id}`);
        continue;
      }

      // Create refund record
      const { error: refundError } = await supabase
        .from("stripe_refunds")
        .insert({
          payment_id: payment.id,
          folio_id: payment.folio_id,
          hotel_id: payment.folios?.hotel_id || payment.hotel_id,
          stripe_refund_id: refund.id,
          stripe_payment_intent_id: charge.payment_intent,
          stripe_charge_id: charge.id,
          amount_cents: refund.amount,
          currency: refund.currency.toUpperCase(),
          status: refund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
          reason: mapRefundReason(refund.reason),
          description: `Automatic refund from Stripe webhook`,
          metadata: {
            payment_intent_id: charge.payment_intent,
            charge_id: charge.id,
            webhook_processed: true,
          },
          refunded_at: refund.status === 'succeeded' ? new Date(refund.created * 1000).toISOString() : null,
        });

      if (refundError) {
        console.error(`❌ Failed to save refund: ${refundError.message}`);
      } else {
        console.log(`✅ Refund saved: ${refund.id} - ${refund.amount / 100} ${refund.currency}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error in handleChargeRefunded: ${error.message}`);
  }
}

// ===========================================
// HELPER: Save payment without reservation
// ===========================================
async function savePaymentWithoutReservation(paymentIntent: any, supabase: any, stripe: Stripe) {
  try {
    console.log('⚠️ Saving payment without reservation link');

    // Extract payment method details
    let paymentMethodDetails: any = {};
    if (paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
        paymentMethodDetails = {
          type: charge.payment_method_details?.type,
          brand: charge.payment_method_details?.card?.brand,
          last4: charge.payment_method_details?.card?.last4,
        };
      } catch (error) {
        console.warn('Could not retrieve charge details');
      }
    }

    // Save minimal payment record for audit
    const { error } = await supabase
      .from("stripe_payments")
      .insert({
        folio_id: null, // No folio linked yet
        hotel_id: null, // Unknown hotel
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: paymentIntent.customer || null,
        stripe_charge_id: paymentIntent.latest_charge || null,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'SUCCEEDED',
        payment_method_type: paymentMethodDetails.type || 'card',
        payment_method_brand: paymentMethodDetails.brand || null,
        payment_method_last4: paymentMethodDetails.last4 || null,
        description: 'Payment without reservation link (requires manual review)',
        receipt_email: paymentIntent.receipt_email || null,
        metadata: {
          webhook_processed: true,
          orphan_payment: true,
          note: 'No reservation found for this payment_intent_id',
        },
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
      });

    if (error) {
      console.error(`❌ Failed to save orphan payment: ${error.message}`);
    } else {
      console.log('✅ Orphan payment saved for manual review');
    }
  } catch (error: any) {
    console.error(`❌ Error in savePaymentWithoutReservation: ${error.message}`);
  }
}

// ===========================================
// HELPER: Map Stripe refund reason to enum
// ===========================================
function mapRefundReason(stripeReason: string | null): string {
  const reasonMap: Record<string, string> = {
    'duplicate': 'DUPLICATE',
    'fraudulent': 'FRAUDULENT',
    'requested_by_customer': 'REQUESTED_BY_CUSTOMER',
  };
  return reasonMap[stripeReason || ''] || 'OTHER';
}
