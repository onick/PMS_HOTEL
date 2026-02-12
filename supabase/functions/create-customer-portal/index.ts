import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

const CustomerPortalSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
  returnUrl: z.string().url('Invalid return URL').optional(),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    const supabase = getSupabaseServiceClient();
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return createCorsResponse({ error: 'Unauthorized' }, 401, origin);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return createCorsResponse({ error: 'Unauthorized' }, 401, origin);
    }

    const body = await req.json();
    const result = CustomerPortalSchema.safeParse(body);
    
    if (!result.success) {
      return createCorsResponse({ error: 'Validation failed', details: result.error.flatten() }, 400, origin);
    }

    const { hotelId, returnUrl } = result.data;

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("hotel_id", hotelId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return createCorsResponse({ error: 'No active subscription found' }, 404, origin);
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${origin}/dashboard/profile`,
    });

    console.log(`✅ Customer portal created for hotel ${hotelId}`);

    return createCorsResponse({ url: session.url }, 200, origin);

  } catch (error: any) {
    console.error("❌ Error creating portal:", error);
    return createCorsResponse(
      { error: error.message || 'Failed to create portal' },
      500,
      origin
    );
  }
});
