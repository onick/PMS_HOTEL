import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Received event: ${event.type}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object, supabase);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object, supabase);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  // Get hotel from stripe customer ID
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("hotel_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // Map Stripe plan to our plan types
  const stripePriceId = subscription.items.data[0]?.price.id;
  const plan = mapStripePriceToPlan(stripePriceId);

  // Map Stripe status to our status
  const status = mapStripeStatus(subscription.status);

  const updateData = {
    plan,
    status,
    stripe_subscription_id: subscriptionId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };

  const { error } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("hotel_id", existingSub.hotel_id);

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }

  console.log(`Subscription updated for hotel ${existingSub.hotel_id}`);
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  const customerId = subscription.customer;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("hotel_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "CANCELED",
      cancel_at_period_end: true,
    })
    .eq("hotel_id", existingSub.hotel_id);

  if (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }

  console.log(`Subscription canceled for hotel ${existingSub.hotel_id}`);
}

async function handleTrialWillEnd(subscription: any, supabase: any) {
  const customerId = subscription.customer;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("hotel_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // TODO: Send email notification to hotel owner
  console.log(`Trial ending soon for hotel ${existingSub.hotel_id}`);
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("hotel_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  // Update status to ACTIVE if it was PAST_DUE or INCOMPLETE
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "ACTIVE" })
    .eq("hotel_id", existingSub.hotel_id)
    .in("status", ["PAST_DUE", "INCOMPLETE"]);

  if (error) {
    console.error("Error updating subscription status:", error);
    throw error;
  }

  console.log(`Payment succeeded for hotel ${existingSub.hotel_id}`);
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("hotel_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!existingSub) {
    console.error("No subscription found for customer:", customerId);
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "PAST_DUE" })
    .eq("hotel_id", existingSub.hotel_id);

  if (error) {
    console.error("Error updating subscription to PAST_DUE:", error);
    throw error;
  }

  console.log(`Payment failed for hotel ${existingSub.hotel_id}`);
}

// Helper functions
function mapStripePriceToPlan(priceId: string): string {
  // Mapeo de Price IDs reales de Stripe configurados
  const priceMap: Record<string, string> = {
    'price_1SMoZNJiUN4FeEoTJJwi21Tm': 'BASIC',
    'price_1SMoayJiUN4FeEoTX4MVfEgz': 'PRO',
    'price_1SMobqJiUN4FeEoTbTXzXhwU': 'ENTERPRISE',
  };

  return priceMap[priceId] || "FREE";
}

function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    trialing: "TRIAL",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
  };

  return statusMap[stripeStatus] || "CANCELED";
}
