import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const { hotelId } = await req.json();

    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: "hotel_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate trial dates
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Reset subscription to FREE/TRIAL
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan: "FREE",
        status: "TRIAL",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        cancel_at_period_end: false,
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
      })
      .eq("hotel_id", hotelId)
      .select()
      .single();

    if (error) {
      console.error("Error resetting subscription:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Subscription reset to FREE/TRIAL successfully",
        data 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
