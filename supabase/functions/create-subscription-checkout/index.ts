import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan Price IDs - Configured with actual Stripe Price IDs
const PLAN_PRICE_IDS: Record<string, string> = {
  BASIC: "price_1SMoZNJiUN4FeEoTJJwi21Tm",
  PRO: "price_1SMoayJiUN4FeEoTX4MVfEgz",
  ENTERPRISE: "price_1SMobqJiUN4FeEoTbTXzXhwU",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { plan, hotelId } = await req.json();

    if (!plan || !hotelId) {
      throw new Error("Missing plan or hotelId");
    }

    if (!PLAN_PRICE_IDS[plan]) {
      throw new Error("Invalid plan");
    }

    // Verify user has access to this hotel
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("hotel_id", hotelId)
      .single();

    if (roleError || !userRole) {
      throw new Error("User does not have access to this hotel");
    }

    if (!["SUPER_ADMIN", "HOTEL_OWNER"].includes(userRole.role)) {
      throw new Error("Only hotel owners can manage subscriptions");
    }

    // Get subscription info
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("hotel_id", hotelId)
      .single();

    let customerId = subscription?.stripe_customer_id;
    const existingSubscriptionId = subscription?.stripe_subscription_id;

    // If there's an active Stripe subscription, update it instead of creating a new one
    if (existingSubscriptionId && subscription?.status !== 'CANCELED') {
      try {
        // Get the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);

        // Update the subscription to the new plan
        await stripe.subscriptions.update(existingSubscriptionId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: PLAN_PRICE_IDS[plan],
          }],
          proration_behavior: 'always_invoice',
          metadata: {
            hotel_id: hotelId,
            plan: plan,
          },
        });

        // Update our database
        await supabase
          .from("subscriptions")
          .update({ plan })
          .eq("hotel_id", hotelId);

        return new Response(
          JSON.stringify({
            message: "Subscription updated successfully",
            redirect: `${req.headers.get("origin")}/dashboard/profile?payment=success`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (error: any) {
        console.error("Error updating subscription:", error);
        // If update fails, fall through to create new checkout
      }
    }

    // Create or get customer
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
          hotel_id: hotelId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("hotel_id", hotelId);
    }

    // Create Checkout Session for new subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLAN_PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/dashboard/profile?payment=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard/profile?payment=canceled`,
      metadata: {
        hotel_id: hotelId,
        user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          hotel_id: hotelId,
          plan: plan,
        },
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
