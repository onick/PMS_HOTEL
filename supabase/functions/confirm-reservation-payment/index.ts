import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmPaymentInput {
  reservationId: string;
  paymentMethod?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const input: ConfirmPaymentInput = await req.json();
    console.log("Confirming payment for reservation:", input);

    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, folios(id, balance_cents)")
      .eq("id", input.reservationId)
      .single();

    if (resError || !reservation) {
      throw new Error("ReservationNotFound");
    }

    if (reservation.status !== "PENDING_PAYMENT") {
      throw new Error(`InvalidStatus: Expected PENDING_PAYMENT, got ${reservation.status}`);
    }

    const days = enumerateDates(reservation.check_in, reservation.check_out);

    for (const day of days) {
      const { error: holdError } = await supabase.rpc("increment_inventory_holds", {
        p_hotel_id: reservation.hotel_id,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: -1,
      });

      if (holdError) {
        console.error("Error releasing hold:", holdError);
        throw new Error(`HoldReleaseError: ${holdError.message}`);
      }

      const { error: reservedError } = await supabase.rpc("increment_inventory_reserved", {
        p_hotel_id: reservation.hotel_id,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: 1,
      });

      if (reservedError) {
        console.error("Error incrementing reserved:", reservedError);
        throw new Error(`ReservedIncrementError: ${reservedError.message}`);
      }
    }

    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "CONFIRMED",
        hold_expires_at: null,
        metadata: {
          ...reservation.metadata,
          payment_confirmed_at: new Date().toISOString(),
          payment_method: input.paymentMethod,
        },
      })
      .eq("id", input.reservationId);

    if (updateError) {
      throw new Error(`UpdateReservationError: ${updateError.message}`);
    }

    const folioId = reservation.folios?.[0]?.id;
    if (folioId) {
      const { error: lineItemError } = await supabase
        .from("folio_line_items")
        .insert({
          folio_id: folioId,
          description: `Hospedaje ${days.length} ${days.length === 1 ? "noche" : "noches"}`,
          amount_cents: reservation.total_amount_cents,
          item_type: "ROOM_CHARGE",
          quantity: days.length,
        });

      if (lineItemError) {
        console.warn("Error creating line item:", lineItemError);
      }

      const { error: folioError } = await supabase.rpc("update_folio_balance", {
        p_folio_id: folioId,
        p_amount_cents: reservation.total_amount_cents,
      });

      if (folioError) {
        console.warn("Error updating folio balance:", folioError);
      }
    }

    console.log("Payment confirmed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        reservationId: input.reservationId,
        status: "CONFIRMED",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "InternalError" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

function enumerateDates(checkIn: string, checkOut: string): string[] {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (start >= end) return [];

    const days: string[] = [];
    const current = new Date(start);

    while (current < end) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    return days;
  } catch {
    return [];
  }
}
