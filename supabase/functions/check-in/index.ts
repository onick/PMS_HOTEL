import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckInInput {
  reservationId: string;
  roomId: string; // Habitación física específica a asignar
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

    const input: CheckInInput = await req.json();
    console.log("Processing check-in:", input);

    // ===== (1) VALIDAR RESERVA =====
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, room_types(name)")
      .eq("id", input.reservationId)
      .single();

    if (resError || !reservation) {
      throw new Error("ReservationNotFound");
    }

    if (reservation.status !== "CONFIRMED") {
      throw new Error(`InvalidStatus: Reservation must be CONFIRMED, current: ${reservation.status}`);
    }

    const today = new Date().toISOString().split("T")[0];
    if (reservation.check_in !== today) {
      throw new Error(`InvalidCheckInDate: Expected ${today}, reservation: ${reservation.check_in}`);
    }

    // ===== (2) VALIDAR HABITACIÓN =====
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", input.roomId)
      .eq("hotel_id", reservation.hotel_id)
      .eq("room_type_id", reservation.room_type_id)
      .single();

    if (roomError || !room) {
      throw new Error("RoomNotFound or RoomTypeMismatch");
    }

    if (room.status !== "AVAILABLE") {
      throw new Error(`RoomNotAvailable: ${room.status}`);
    }

    // ===== (3) EJECUTAR CHECK-IN =====
    // Actualizar estado de reserva
    const { error: updateResError } = await supabase
      .from("reservations")
      .update({
        status: "CHECKED_IN",
        room_id: input.roomId,
        metadata: {
          ...reservation.metadata,
          checked_in_at: new Date().toISOString(),
          assigned_room_number: room.room_number,
          check_in_notes: input.notes || null,
        },
      })
      .eq("id", input.reservationId);

    if (updateResError) {
      throw new Error(`UpdateReservationError: ${updateResError.message}`);
    }

    // Actualizar estado de habitación a OCCUPIED
    const { error: updateRoomError } = await supabase
      .from("rooms")
      .update({ status: "OCCUPIED" })
      .eq("id", input.roomId);

    if (updateRoomError) {
      throw new Error(`UpdateRoomError: ${updateRoomError.message}`);
    }

    // Crear room_lock (asignación física)
    const { error: lockError } = await supabase
      .from("room_locks")
      .insert({
        hotel_id: reservation.hotel_id,
        room_id: input.roomId,
        day: today,
        reservation_id: input.reservationId,
      });

    if (lockError) {
      console.warn("RoomLockError (non-critical):", lockError.message);
    }

    console.log("Check-in completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        reservationId: input.reservationId,
        roomNumber: room.room_number,
        status: "CHECKED_IN",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error during check-in:", error);
    return new Response(
      JSON.stringify({ error: error.message || "InternalError" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
