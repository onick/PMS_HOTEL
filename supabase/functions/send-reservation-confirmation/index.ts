import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReservationConfirmationRequest {
  reservation_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation_id } = await req.json() as ReservationConfirmationRequest;

    if (!reservation_id) {
      throw new Error("Missing reservation_id");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch reservation details with guest and room info
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select(`
        *,
        guests!inner(full_name, email, phone),
        rooms!inner(room_number, room_type),
        hotels!inner(name)
      `)
      .eq("id", reservation_id)
      .single();

    if (resError || !reservation) {
      throw new Error(`Reservation not found: ${resError?.message}`);
    }

    const hotelName = reservation.hotels?.name || "SOLARIS PMS";
    const guestName = reservation.guests?.full_name || "Estimado huésped";
    const guestEmail = reservation.guests?.email;

    if (!guestEmail) {
      throw new Error("Guest email not found");
    }

    // Calculate number of nights
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Status labels
    const statusLabels: Record<string, string> = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmada",
      CHECKED_IN: "Check-in realizado",
      CHECKED_OUT: "Check-out realizado",
      CANCELLED: "Cancelada",
      NO_SHOW: "No show",
    };

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #667eea; }
            .value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .highlight { background: #667eea; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Confirmación de Reserva</h1>
              <p style="font-size: 18px; margin: 10px 0 0 0;">${hotelName}</p>
            </div>
            <div class="content">
              <h2>¡Hola ${guestName}!</h2>
              <p>Tu reserva ha sido confirmada. Estamos emocionados de recibirte pronto.</p>
              
              <div class="highlight">
                <h3 style="margin: 0;">Código de Reserva</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${reservation.confirmation_code || reservation.id.slice(0, 8).toUpperCase()}</p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Detalles de la Reserva</h3>
                
                <div class="detail-row">
                  <span class="label">Check-in:</span>
                  <span class="value">${formatDate(checkIn)}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Check-out:</span>
                  <span class="value">${formatDate(checkOut)}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Noches:</span>
                  <span class="value">${nights} ${nights === 1 ? 'noche' : 'noches'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Habitación:</span>
                  <span class="value">${reservation.rooms?.room_number} - ${reservation.rooms?.room_type}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Huéspedes:</span>
                  <span class="value">${reservation.number_of_guests} ${reservation.number_of_guests === 1 ? 'persona' : 'personas'}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Total:</span>
                  <span class="value" style="font-size: 18px; font-weight: bold; color: #667eea;">$${(reservation.total_amount_cents / 100).toFixed(2)}</span>
                </div>
                
                <div class="detail-row" style="border-bottom: none;">
                  <span class="label">Estado:</span>
                  <span class="value">${statusLabels[reservation.status] || reservation.status}</span>
                </div>
              </div>

              <h3>Información Importante</h3>
              <ul>
                <li><strong>Horario de check-in:</strong> A partir de las 15:00</li>
                <li><strong>Horario de check-out:</strong> Hasta las 12:00</li>
                <li><strong>Contacto:</strong> ${reservation.guests?.phone || 'No especificado'}</li>
              </ul>

              ${reservation.special_requests ? `
                <div class="info-box">
                  <h4 style="margin-top: 0;">Solicitudes Especiales</h4>
                  <p>${reservation.special_requests}</p>
                </div>
              ` : ''}

              <p style="margin-top: 30px;">Si necesitas hacer cambios en tu reserva o tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <p><strong>¡Te esperamos!</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${hotelName} - Powered by SOLARIS PMS</p>
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${hotelName} <reservas@solaris-pms.com>`,
        to: guestEmail,
        subject: `Confirmación de Reserva - ${hotelName}`,
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(`Failed to send email: ${JSON.stringify(emailData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: true, data: emailData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending reservation confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
