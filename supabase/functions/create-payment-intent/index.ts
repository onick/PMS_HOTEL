import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts'
import { PaymentIntentSchema, validateRequest } from '../_shared/validation.ts'

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
    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateRequest(PaymentIntentSchema, body);

    // Create PaymentIntent with validated data
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount), // Stripe expects cents
      currency: validatedData.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        reservationId: validatedData.reservationId,
        ...validatedData.metadata,
      },
    });

    return createCorsResponse(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      200,
      origin
    );

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    
    return createCorsResponse(
      { 
        error: error.message || 'Failed to create payment intent',
        code: error.code || 'PAYMENT_INTENT_ERROR'
      },
      error.message.includes('Validation failed') ? 400 : 500,
      origin
    );
  }
});
