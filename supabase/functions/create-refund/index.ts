// ===========================================
// CREATE REFUND
// Process refunds for payments
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { validateRequest } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const CreateRefundSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amountCents: z.number().int().positive('Amount must be positive').optional(),
  reason: z.enum(['DUPLICATE', 'FRAUDULENT', 'REQUESTED_BY_CUSTOMER', 'CANCELED_RESERVATION', 'OTHER']),
  notes: z.string().optional(),
});

// Validate Stripe key on startup
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('🔄 Create refund request received');

    // Validate request body
    const body = await req.json();
    const input = validateRequest(CreateRefundSchema, body);

    console.log(`✅ Validated refund request for payment: ${input.paymentId}`);

    const supabase = getSupabaseServiceClient();

    // ===== (1) GET PAYMENT DETAILS =====
    const { data: payment, error: paymentError } = await supabase
      .from('stripe_payments')
      .select('*, folios(id, hotel_id, balance_cents)')
      .eq('id', input.paymentId)
      .single();

    if (paymentError || !payment) {
      console.error(`❌ Payment not found: ${input.paymentId}`);
      return createCorsResponse(
        { error: 'Payment not found' },
        404,
        origin
      );
    }

    // Verify payment succeeded
    if (payment.status !== 'SUCCEEDED') {
      console.error(`❌ Payment not succeeded: ${payment.status}`);
      return createCorsResponse(
        { error: 'Can only refund succeeded payments', details: `Payment status: ${payment.status}` },
        400,
        origin
      );
    }

    console.log(`💳 Payment found: ${payment.stripe_payment_intent_id} - ${payment.amount_cents / 100} ${payment.currency}`);

    // ===== (2) CALCULATE REFUND AMOUNT =====
    const refundAmount = input.amountCents || payment.amount_cents;

    if (refundAmount > payment.amount_cents) {
      console.error(`❌ Refund amount exceeds payment: ${refundAmount} > ${payment.amount_cents}`);
      return createCorsResponse(
        { 
          error: 'Refund amount exceeds payment amount',
          details: `Max refundable: ${payment.amount_cents / 100} ${payment.currency}`
        },
        400,
        origin
      );
    }

    // Check existing refunds
    const { data: existingRefunds } = await supabase
      .from('stripe_refunds')
      .select('amount_cents')
      .eq('payment_id', payment.id)
      .eq('status', 'SUCCEEDED');

    const totalRefunded = (existingRefunds || []).reduce((sum, r) => sum + r.amount_cents, 0);
    const availableToRefund = payment.amount_cents - totalRefunded;

    if (refundAmount > availableToRefund) {
      console.error(`❌ Insufficient amount to refund: ${refundAmount} > ${availableToRefund}`);
      return createCorsResponse(
        {
          error: 'Insufficient amount to refund',
          details: `Already refunded: ${totalRefunded / 100}, Available: ${availableToRefund / 100} ${payment.currency}`
        },
        400,
        origin
      );
    }

    console.log(`💰 Refund amount: ${refundAmount / 100} ${payment.currency} (available: ${availableToRefund / 100})`);

    // ===== (3) PROCESS REFUND IN STRIPE =====
    let stripeRefund;
    try {
      console.log(`🔄 Creating refund in Stripe for payment_intent: ${payment.stripe_payment_intent_id}`);

      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: refundAmount,
        reason: mapReasonToStripe(input.reason),
        metadata: {
          payment_id: payment.id,
          folio_id: payment.folio_id,
          hotel_id: payment.hotel_id,
          reason: input.reason,
          notes: input.notes || '',
        },
      });

      console.log(`✅ Stripe refund created: ${stripeRefund.id}`);
    } catch (stripeError: any) {
      console.error(`❌ Stripe refund failed: ${stripeError.message}`);
      return createCorsResponse(
        {
          error: 'Stripe refund failed',
          details: stripeError.message,
          code: stripeError.code,
        },
        500,
        origin
      );
    }

    // ===== (4) SAVE REFUND TO DATABASE =====
    const { data: refundRecord, error: refundError } = await supabase
      .from('stripe_refunds')
      .insert({
        payment_id: payment.id,
        folio_id: payment.folio_id,
        hotel_id: payment.hotel_id || payment.folios?.hotel_id,
        stripe_refund_id: stripeRefund.id,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        stripe_charge_id: payment.stripe_charge_id,
        amount_cents: refundAmount,
        currency: payment.currency,
        status: stripeRefund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
        reason: input.reason,
        description: input.notes || `Refund for payment ${payment.id}`,
        notes: input.notes,
        metadata: {
          stripe_refund_status: stripeRefund.status,
          original_payment_amount: payment.amount_cents,
        },
        refunded_at: stripeRefund.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (refundError) {
      console.error(`❌ Database refund insert failed: ${refundError.message}`);
      return createCorsResponse(
        {
          error: 'Failed to save refund to database',
          details: refundError.message,
          stripeRefundId: stripeRefund.id,
        },
        500,
        origin
      );
    }

    console.log(`✅ Refund saved to database: ${refundRecord.id}`);

    // Note: Balance update happens automatically via trigger (handle_refund_balance)

    // ===== (5) RETURN SUCCESS =====
    return createCorsResponse(
      {
        success: true,
        refundId: refundRecord.id,
        stripeRefundId: stripeRefund.id,
        amountCents: refundAmount,
        currency: payment.currency,
        status: stripeRefund.status,
        newFolioBalance: (payment.folios?.balance_cents || 0) - refundAmount,
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

// ===========================================
// HELPER: Map internal reason to Stripe reason
// ===========================================
function mapReasonToStripe(reason: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined {
  const reasonMap: Record<string, 'duplicate' | 'fraudulent' | 'requested_by_customer'> = {
    'DUPLICATE': 'duplicate',
    'FRAUDULENT': 'fraudulent',
    'REQUESTED_BY_CUSTOMER': 'requested_by_customer',
  };
  return reasonMap[reason];
}
