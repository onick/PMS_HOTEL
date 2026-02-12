import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts'
import { PaymentIntentSchema, validateRequest } from '../_shared/validation.ts'
import { captureError, isSentryConfigured } from '../_shared/sentry.ts'
import {
  checkRateLimit,
  getIdentifier,
  createRateLimitResponse,
  addRateLimitHeaders,
  isRateLimitingEnabled,
} from '../_shared/rate-limiter.ts'

// Validate Stripe key on startup
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Log monitoring status on startup
if (isSentryConfigured()) {
  console.log('✅ Sentry error tracking enabled');
} else {
  console.log('⚠️ Sentry not configured - errors will only be logged locally');
}

if (isRateLimitingEnabled()) {
  console.log('✅ Rate limiting enabled');
} else {
  console.log('⚠️ Rate limiting not configured - no abuse protection');
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  // Check rate limit
  const identifier = getIdentifier(req);
  const rateLimitResult = await checkRateLimit(identifier, 'create-payment-intent');

  if (!rateLimitResult.allowed) {
    console.warn(`⚠️ Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.resetAt, origin);
  }

  console.log(`✅ Rate limit OK: ${rateLimitResult.remaining}/${rateLimitResult.limit} remaining`);

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

    const response = createCorsResponse(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      200,
      origin
    );

    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);

  } catch (error) {
    console.error('❌ Payment intent creation failed:', error);

    // Capture error in Sentry (only for server errors, not validation)
    if (!error.message.includes('Validation failed')) {
      await captureError(error, {
        functionName: 'create-payment-intent',
        extra: {
          origin,
          errorCode: error.code,
        },
      });
    }

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
