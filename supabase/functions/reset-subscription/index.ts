// ===========================================
// RESET SUBSCRIPTION TO FREE/TRIAL
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validation schema
const ResetSubscriptionSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
});

// Validate request helper
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('🔄 Reset subscription request received');

    // Validate request body
    const body = await req.json();
    const { hotelId } = validateRequest(ResetSubscriptionSchema, body);

    console.log(`✅ Validated hotel ID: ${hotelId}`);

    // Get Supabase client
    const supabase = getSupabaseServiceClient();

    // Calculate trial dates
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log(`📅 Resetting to FREE/TRIAL (expires: ${trialEnd.toISOString()})`);

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
      console.error(`❌ Database error: ${error.message}`);
      return createCorsResponse(
        { error: 'Failed to reset subscription', details: error.message },
        500,
        origin
      );
    }

    console.log('✅ Subscription reset successfully');

    return createCorsResponse(
      {
        message: 'Subscription reset to FREE/TRIAL successfully',
        subscription: data,
        trialEndsAt: trialEnd.toISOString(),
      },
      200,
      origin
    );

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);

    // Validation errors return 400, others return 500
    const status = error.message.includes('Validation failed') ? 400 : 500;

    return createCorsResponse(
      { error: error.message },
      status,
      origin
    );
  }
});
