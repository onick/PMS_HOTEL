import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getSupabaseServiceClient } from '../_shared/supabase.ts';

// Validate environment variables on startup
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    
    // Return 400 for signature verification failures (Stripe will retry)
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

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  try {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    // Get hotel from stripe customer ID
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("hotel_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error(`❌ No subscription found for customer: ${customerId}`);
      return;
    }

    // Map Stripe plan to our plan types
    const stripePriceId = subscription.items.data[0]?.price.id;
    const plan = mapStripePriceToPlan(stripePriceId);
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
      console.error("❌ Error updating subscription:", error);
      throw error;
    }

    console.log(`✅ Subscription updated for hotel ${existingSub.hotel_id}: ${plan} - ${status}`);
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  try {
    const customerId = subscription.customer;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("hotel_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error(`❌ No subscription found for customer: ${customerId}`);
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
      console.error("❌ Error canceling subscription:", error);
      throw error;
    }

    console.log(`✅ Subscription canceled for hotel ${existingSub.hotel_id}`);
  } catch (error) {
    console.error('❌ Error in handleSubscriptionDeleted:', error);
    throw error;
  }
}

async function handleTrialWillEnd(subscription: any, supabase: any) {
  try {
    const customerId = subscription.customer;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("hotel_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error(`❌ No subscription found for customer: ${customerId}`);
      return;
    }

    // TODO: Send email notification to hotel owner
    console.log(`⚠️  Trial ending soon for hotel ${existingSub.hotel_id}`);
  } catch (error) {
    console.error('❌ Error in handleTrialWillEnd:', error);
    // Don't throw - this is not critical
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("hotel_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error(`❌ No subscription found for customer: ${customerId}`);
      return;
    }

    // Update status to ACTIVE if it was PAST_DUE or INCOMPLETE
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "ACTIVE" })
      .eq("hotel_id", existingSub.hotel_id)
      .in("status", ["PAST_DUE", "INCOMPLETE"]);

    if (error) {
      console.error("❌ Error updating subscription status:", error);
      throw error;
    }

    console.log(`✅ Payment succeeded for hotel ${existingSub.hotel_id}`);
  } catch (error) {
    console.error('❌ Error in handlePaymentSucceeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("hotel_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error(`❌ No subscription found for customer: ${customerId}`);
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "PAST_DUE" })
      .eq("hotel_id", existingSub.hotel_id);

    if (error) {
      console.error("❌ Error updating subscription to PAST_DUE:", error);
      throw error;
    }

    console.log(`⚠️  Payment failed for hotel ${existingSub.hotel_id} - Status: PAST_DUE`);
  } catch (error) {
    console.error('❌ Error in handlePaymentFailed:', error);
    throw error;
  }
}

// Helper functions
function mapStripePriceToPlan(priceId: string): string {
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
