import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckOutInput {
  reservationId: string;
  notes?: string;
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

    const input: CheckOutInput = await req.json();
    console.log("Processing check-out:", input);

    // ===== (1) VALIDAR RESERVA =====
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, folios(*)")
      .eq("id", input.reservationId)
      .single();

    if (resError || !reservation) {
      throw new Error("ReservationNotFound");
    }

    if (reservation.status !== "CHECKED_IN") {
      throw new Error(`InvalidStatus: Reservation must be CHECKED_IN, current: ${reservation.status}`);
    }

    // ===== (2) VERIFICAR FOLIO =====
    const folio = reservation.folios;
    if (!folio) {
      throw new Error("FolioNotFound");
    }

    if (folio.balance_cents > 0) {
      throw new Error(`UnpaidBalance: Balance pendiente de RD$${(folio.balance_cents / 100).toFixed(2)}`);
    }

    // ===== (3) EJECUTAR CHECK-OUT =====
    // Actualizar estado de reserva
    const { error: updateResError } = await supabase
      .from("reservations")
      .update({
        status: "CHECKED_OUT",
        metadata: {
          ...reservation.metadata,
          checked_out_at: new Date().toISOString(),
          check_out_notes: input.notes || null,
        },
      })
      .eq("id", input.reservationId);

    if (updateResError) {
      throw new Error(`UpdateReservationError: ${updateResError.message}`);
    }

    // Liberar habitación (cambiar a AVAILABLE)
    if (reservation.room_id) {
      const { error: updateRoomError } = await supabase
        .from("rooms")
        .update({ status: "MAINTENANCE" }) // Cambiar a MAINTENANCE para limpieza
        .eq("id", reservation.room_id);

      if (updateRoomError) {
        console.warn("UpdateRoomError (non-critical):", updateRoomError.message);
      }
    }

    console.log("Check-out completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        reservationId: input.reservationId,
        status: "CHECKED_OUT",
        finalBalance: folio.balance_cents,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error during check-out:", error);
    return new Response(
      JSON.stringify({ error: error.message || "InternalError" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
