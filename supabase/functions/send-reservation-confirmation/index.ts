// ===========================================
// SEND RESERVATION CONFIRMATION EMAIL
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validate environment variables on startup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

// Validation schema
const ReservationConfirmationSchema = z.object({
  reservation_id: z.string().uuid('Invalid reservation ID'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('📧 Send reservation confirmation request received');

    // Validate request body
    const body = await req.json();
    const { reservation_id } = ReservationConfirmationSchema.parse(body);

    console.log(`✅ Validated reservation ID: ${reservation_id}`);

    const supabase = getSupabaseServiceClient();

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
      console.error(`❌ Reservation not found: ${reservation_id}`);
      return createCorsResponse(
        {
          error: 'Reservation not found',
          details: resError?.message
        },
        404,
        origin
      );
    }

    const hotelName = reservation.hotels?.name || "SOLARIS PMS";
    const guestName = reservation.guests?.full_name || "Estimado huésped";
    const guestEmail = reservation.guests?.email;

    if (!guestEmail) {
      console.error('❌ Guest email not found');
      return createCorsResponse(
        { error: 'Guest email not found' },
        400,
        origin
      );
    }

    console.log(`✅ Guest email: ${guestEmail}`);

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

    console.log('✅ Email HTML template generated');

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
      console.error(`❌ Resend API error: ${JSON.stringify(emailData)}`);
      return createCorsResponse(
        {
          error: 'Failed to send email',
          details: emailData
        },
        500,
        origin
      );
    }

    console.log(`✅ Confirmation email sent successfully: ${emailData.id}`);

    return createCorsResponse(
      { success: true, email_sent: true, data: emailData },
      200,
      origin
    );

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);

    // Zod validation errors
    if (error.name === 'ZodError') {
      return createCorsResponse(
        { error: 'Invalid request data', details: error.errors },
        400,
        origin
      );
    }

    return createCorsResponse(
      { error: error.message || 'Internal error' },
      500,
      origin
    );
  }
});
