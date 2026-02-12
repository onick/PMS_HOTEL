import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { SubscriptionCheckoutSchema, validateRequest } from '../_shared/validation.ts';

// Validate environment on startup
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Plan Price IDs - Move to env vars for production
const PLAN_PRICE_IDS: Record<string, string> = {
  BASIC: Deno.env.get('STRIPE_BASIC_PRICE_ID') || "price_1SMoZNJiUN4FeEoTJJwi21Tm",
  PRO: Deno.env.get('STRIPE_PRO_PRICE_ID') || "price_1SMoayJiUN4FeEoTX4MVfEgz",
  ENTERPRISE: Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID') || "price_1SMobqJiUN4FeEoTbTXzXhwU",
};

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    const supabase = getSupabaseServiceClient();

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401, origin);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return createCorsResponse({ error: 'Unauthorized' }, 401, origin);
    }

    // Validate request body
    const body = await req.json();
    const validated = validateRequest(SubscriptionCheckoutSchema, body);

    if (!PLAN_PRICE_IDS[validated.plan]) {
      return createCorsResponse({ error: `Invalid plan: ${validated.plan}` }, 400, origin);
    }

    // Verify user has admin access to hotel
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("hotel_id", validated.hotelId)
      .single();

    if (roleError || !userRole) {
      console.error('Access denied:', { userId: user.id, hotelId: validated.hotelId });
      return createCorsResponse({ error: 'Access denied to this hotel' }, 403, origin);
    }

    if (!["SUPER_ADMIN", "HOTEL_OWNER"].includes(userRole.role)) {
      return createCorsResponse(
        { error: 'Only hotel owners can manage subscriptions' }, 
        403, 
        origin
      );
    }

    // Get existing subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status, plan")
      .eq("hotel_id", validated.hotelId)
      .single();

    let customerId = subscription?.stripe_customer_id;
    const existingSubscriptionId = subscription?.stripe_subscription_id;

    // Try to update existing subscription first
    if (existingSubscriptionId && subscription?.status !== 'CANCELED') {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);

        // Update to new plan
        await stripe.subscriptions.update(existingSubscriptionId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: PLAN_PRICE_IDS[validated.plan],
          }],
          proration_behavior: 'always_invoice',
          metadata: {
            hotel_id: validated.hotelId,
            plan: validated.plan,
          },
        });

        // Update database
        await supabase
          .from("subscriptions")
          .update({ plan: validated.plan })
          .eq("hotel_id", validated.hotelId);

        console.log(`✅ Subscription updated: ${subscription.plan} → ${validated.plan}`);

        const successUrl = validated.successUrl || 
          `${origin}/dashboard/profile?payment=success`;

        return createCorsResponse(
          { message: 'Subscription updated', redirect: successUrl },
          200,
          origin
        );
      } catch (error: any) {
        console.error("⚠️  Could not update existing subscription:", error.message);
        // Fall through to create new checkout
      }
    }

    // Create Stripe customer if needed
    if (!customerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        metadata: {
          hotel_id: validated.hotelId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("hotel_id", validated.hotelId);

      console.log(`✅ Created Stripe customer: ${customerId}`);
    }

    // Create Checkout Session
    const successUrl = validated.successUrl || `${origin}/dashboard/profile?payment=success`;
    const cancelUrl = validated.cancelUrl || `${origin}/dashboard/profile?payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price: PLAN_PRICE_IDS[validated.plan],
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        hotel_id: validated.hotelId,
        user_id: user.id,
        plan: validated.plan,
      },
      subscription_data: {
        metadata: {
          hotel_id: validated.hotelId,
          plan: validated.plan,
        },
      },
    });

    console.log(`✅ Checkout session created: ${session.id} for plan ${validated.plan}`);

    return createCorsResponse(
      { sessionId: session.id, url: session.url },
      200,
      origin
    );

  } catch (error: any) {
    console.error("❌ Error creating checkout:", error);
    return createCorsResponse(
      { error: error.message || 'Failed to create checkout session' },
      error.message.includes('Validation') ? 400 : 500,
      origin
    );
  }
});
