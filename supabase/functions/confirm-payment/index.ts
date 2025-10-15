import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmPaymentInput {
  hotelId: string;
  reservationId: string;
  paymentIntentId: string;
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
    console.log("Confirming payment:", input);

    // ===== VERIFICAR STRIPE (simulado) =====
    // En producción: await stripeVerifySucceeded(input.paymentIntentId)
    const paymentOk = true;

    if (!paymentOk) {
      throw new Error("PaymentNotConfirmed");
    }

    // ===== OBTENER RESERVA =====
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, room_types(id)")
      .eq("id", input.reservationId)
      .eq("hotel_id", input.hotelId)
      .single();

    if (resError || !reservation) {
      throw new Error("ReservationNotFound");
    }

    if (reservation.status !== "PENDING_PAYMENT") {
      return new Response(
        JSON.stringify({ message: "Already processed", status: reservation.status }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar expiración del hold
    const holdExpiresAt = new Date(reservation.hold_expires_at);
    if (holdExpiresAt < new Date()) {
      throw new Error("HoldExpired");
    }

    // ===== CONVERTIR HOLDS → RESERVED =====
    const days = enumerateDates(reservation.check_in, reservation.check_out);

    for (const day of days) {
      // Decrementar holds
      await supabase.rpc("increment_inventory_holds", {
        p_hotel_id: input.hotelId,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: -1,
      });

      // Incrementar reserved
      await supabase.rpc("increment_inventory_reserved", {
        p_hotel_id: input.hotelId,
        p_room_type_id: reservation.room_type_id,
        p_day: day,
        p_delta: 1,
      });
    }

    // ===== ACTUALIZAR ESTADO =====
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "CONFIRMED",
        hold_expires_at: null,
      })
      .eq("id", input.reservationId);

    if (updateError) {
      throw new Error(`UpdateError: ${updateError.message}`);
    }

    console.log("Payment confirmed successfully");

    return new Response(
      JSON.stringify({ message: "Payment confirmed", reservationId: input.reservationId }),
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