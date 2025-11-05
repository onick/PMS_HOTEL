// ===========================================
// SHARED CORS CONFIGURATION
// ===========================================
// Secure CORS handler with origin whitelist

const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://lovable.dev',
  // Add your production domains here:
  // 'https://app.hotelmate.com',
  // 'https://hotelmate.com',
];

/**
 * Get CORS headers with origin validation
 * @param origin - Request origin header
 * @returns CORS headers object
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Determine if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS preflight request
 * @param origin - Request origin header
 * @returns Response with CORS headers
 */
export function handleCorsPrelight(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Create JSON response with CORS headers
 * @param data - Response data
 * @param status - HTTP status code
 * @param origin - Request origin header
 * @returns Response with data and CORS headers
 */
export function createCorsResponse(
  data: any,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}
