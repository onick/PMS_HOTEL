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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { hotelId } = await req.json();

    if (!hotelId) {
      throw new Error("Missing hotelId");
    }

    // Verify user has access
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

    // Get Stripe customer ID and hotel info
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("hotel_id", hotelId)
      .single();

    if (subError) {
      throw new Error("No subscription found for this hotel");
    }

    let customerId = subscription?.stripe_customer_id;

    // If no Stripe customer exists yet, create one
    if (!customerId) {
      const { data: hotel } = await supabase
        .from("hotels")
        .select("name")
        .eq("id", hotelId)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: hotel?.name || "Hotel",
        metadata: {
          hotel_id: hotelId,
          user_id: user.id,
        },
      });

      // Update subscription with customer ID
      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customer.id })
        .eq("hotel_id", hotelId);

      customerId = customer.id;
    }

    // Create portal session with configuration
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get("origin")}/dashboard/profile?tab=subscription`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
