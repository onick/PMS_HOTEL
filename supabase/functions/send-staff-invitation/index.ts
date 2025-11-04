import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffInvitationRequest {
  invitation_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id } = await req.json() as StaffInvitationRequest;

    if (!invitation_id) {
      throw new Error("Missing invitation_id");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffInvitationRequest {
  invitation_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitation_id } = await req.json() as StaffInvitationRequest;

    if (!invitation_id) {
      throw new Error("Missing invitation_id");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      throw new Error(`Invitation not found: ${invError?.message}`);
    }

    // Get hotel name
    const hotelName = invitation.hotels?.name || "SOLARIS PMS";

    // Build invitation URL
    const invitationUrl = `${Deno.env.get("APP_URL")}/auth?token=${invitation.invitation_token}&type=staff`;

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
    console.error("Error sending staff invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
