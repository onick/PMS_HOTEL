// ===========================================
// SEND STAFF INVITATION EMAIL
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { getSupabaseServiceClient } from '../_shared/supabase.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validate environment variables on startup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://app.solaris-pms.com";

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

// Validation schema
const StaffInvitationSchema = z.object({
  invitation_id: z.string().uuid('Invalid invitation ID'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('📧 Send staff invitation request received');

    // Validate request body
    const body = await req.json();
    const { invitation_id } = StaffInvitationSchema.parse(body);

    console.log(`✅ Validated invitation ID: ${invitation_id}`);

    const supabase = getSupabaseServiceClient();

    // Fetch invitation details
    const { data: invitation, error: invError } = await supabase
      .from("staff_invitations")
      .select(`
        *,
        hotels!inner(name)
      `)
      .eq("id", invitation_id)
      .single();

    if (invError || !invitation) {
      console.error(`❌ Invitation not found: ${invitation_id}`);
      return createCorsResponse(
        {
          error: 'Invitation not found',
          details: invError?.message
        },
        404,
        origin
      );
    }

    const hotelName = invitation.hotels?.name || "SOLARIS PMS";
    console.log(`✅ Hotel: ${hotelName}`);

    // Build invitation URL
    const invitationUrl = `${APP_URL}/auth?token=${invitation.invitation_token}&type=staff`;

    // Role labels in Spanish
    const roleLabels: Record<string, string> = {
      MANAGER: "Manager",
      RECEPTION: "Recepción",
      HOUSEKEEPING: "Limpieza",
      MAINTENANCE: "Mantenimiento",
      STAFF: "Personal",
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
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Invitación a ${hotelName}</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${invitation.full_name}!</h2>
              <p>Has sido invitado/a a unirse al equipo de <strong>${hotelName}</strong> en SOLARIS PMS.</p>

              <div class="info-box">
                <strong>Detalles de la invitación:</strong><br>
                <strong>Rol:</strong> ${roleLabels[invitation.role] || invitation.role}<br>
                <strong>Email:</strong> ${invitation.email}<br>
                <strong>Válida hasta:</strong> ${new Date(invitation.expires_at).toLocaleDateString('es-ES')}
              </div>

              <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>

              <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
              </div>

              <p style="font-size: 12px; color: #666;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${invitationUrl}">${invitationUrl}</a>
              </p>

              <p><strong>Nota:</strong> Esta invitación expirará en 7 días.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SOLARIS PMS - Sistema de Gestión Hotelera</p>
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
        from: "SOLARIS PMS <noreply@solaris-pms.com>",
        to: invitation.email,
        subject: `Invitación al equipo de ${hotelName}`,
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

    console.log(`✅ Staff invitation email sent successfully: ${emailData.id}`);

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
