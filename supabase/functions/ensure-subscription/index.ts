import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const EnsureSubscriptionSchema = z.object({
  hotelId: z.string().uuid('Invalid hotel ID'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json();
    const result = EnsureSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return createCorsResponse(
        { error: 'Validation failed', details: result.error.flatten() }, 
        400, 
        origin
      );
    }

    const { hotelId } = result.data;

    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    if (existing) {
      console.log(`✅ Subscription already exists for hotel ${hotelId}`);
      return createCorsResponse({ subscription: existing }, 200, origin);
    }

    // Create default FREE subscription
    const { data: newSubscription, error } = await supabase
      .from('subscriptions')
      .insert({
        hotel_id: hotelId,
        plan: 'FREE',
        status: 'TRIAL',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    console.log(`✅ Created FREE trial subscription for hotel ${hotelId}`);

    return createCorsResponse({ subscription: newSubscription }, 201, origin);

  } catch (error: any) {
    console.error("❌ Error ensuring subscription:", error);
    return createCorsResponse(
      { error: error.message || 'Failed to ensure subscription' },
      500,
      origin
    );
  }
});
