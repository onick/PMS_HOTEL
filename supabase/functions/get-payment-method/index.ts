// ===========================================
// GET PAYMENT METHOD (STRIPE CARD)
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import Stripe from "https://esm.sh/stripe@14.21.0";

// Validate environment variables on startup
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Validation schema
const GetPaymentMethodSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('💳 Get payment method request received');

    // Create authenticated Supabase client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createCorsResponse(
        { error: 'Missing authorization header' },
        401,
        origin
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Validate request body
    const body = await req.json();
    const { hotelId } = GetPaymentMethodSchema.parse(body);

    console.log(`✅ Validated hotel ID: ${hotelId}`);

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ User not authenticated');
      return createCorsResponse(
        { error: 'Not authenticated' },
        401,
        origin
      );
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Verify user has access to this hotel
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("hotel_id", hotelId)
      .single();

    if (roleError || !userRole) {
      console.warn(`⚠️ User ${user.id} has no access to hotel ${hotelId}`);
      return createCorsResponse(
        { error: 'You do not have access to this hotel' },
        403,
        origin
      );
    }

    console.log(`✅ User has role: ${userRole.role}`);

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("hotel_id", hotelId)
      .single();

    if (!subscription?.stripe_customer_id) {
      console.log('ℹ️ No Stripe customer found');
      return createCorsResponse(
        { paymentMethod: null },
        200,
        origin
      );
    }

    console.log(`✅ Found Stripe customer: ${subscription.stripe_customer_id}`);

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscription.stripe_customer_id,
      type: "card",
    });

    const defaultPaymentMethod = paymentMethods.data[0] || null;

    console.log(`✅ Retrieved ${paymentMethods.data.length} payment methods`);

    return createCorsResponse(
      { paymentMethod: defaultPaymentMethod },
      200,
      origin
    );

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);

    // Zod validation errors
    if (error.name === 'ZodError') {
      return createCorsResponse(
        { error: 'Invalid request data', details: error.errors },
        400,
        origin
      );
    }

    return createCorsResponse(
      { error: error.message || 'Internal error' },
      500,
      origin
    );
  }
});
