// ===========================================
// SEND EMAIL VIA RESEND
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPrelight, createCorsResponse } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validate environment variables on startup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

// Validation schema
const EmailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'HTML content is required'),
  from: z.string().email('Invalid sender email').default('SOLARIS PMS <noreply@solaris-pms.com>'),
});

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(origin);
  }

  try {
    console.log('📧 Send email request received');

    // Validate request body
    const body = await req.json();
    const { to, subject, html, from } = EmailSchema.parse(body);

    console.log(`✅ Validated email to: ${to}`);

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Resend API error: ${JSON.stringify(data)}`);
      return createCorsResponse(
        {
          error: 'Failed to send email',
          details: data
        },
        500,
        origin
      );
    }

    console.log(`✅ Email sent successfully: ${data.id}`);

    return createCorsResponse(
      { success: true, data },
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
