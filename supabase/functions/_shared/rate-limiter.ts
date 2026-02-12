// ===========================================
// SHARED RATE LIMITING (Upstash Redis)
// ===========================================
// Sliding window rate limiting for Edge Functions
// Uses Upstash Redis REST API (serverless-friendly)

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

// Rate limit configurations by function type
export const RATE_LIMITS = {
  // Payment functions - strict limits
  'create-payment-intent': { requests: 10, window: 60 }, // 10 req/min per IP
  'confirm-payment': { requests: 5, window: 60 }, // 5 req/min per IP

  // Subscription functions - moderate limits
  'create-subscription-checkout': { requests: 5, window: 60 },
  'create-customer-portal': { requests: 10, window: 60 },

  // Info functions - relaxed limits
  'get-payment-history': { requests: 30, window: 60 },
  'get-payment-method': { requests: 30, window: 60 },

  // Email functions - moderate limits (prevent spam)
  'send-email': { requests: 10, window: 60 },
  'send-reservation-confirmation': { requests: 5, window: 60 },

  // Default for unlisted functions
  'default': { requests: 20, window: 60 },
};

/**
 * Check if rate limiting is configured
 */
export function isRateLimitingEnabled(): boolean {
  return !!(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get rate limit for a function
 */
function getRateLimit(functionName: string): { requests: number; window: number } {
  return RATE_LIMITS[functionName as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
}

/**
 * Generate rate limit key for Redis
 */
function getRateLimitKey(identifier: string, functionName: string): string {
  return `ratelimit:${functionName}:${identifier}`;
}

/**
 * Execute Redis command via REST API
 */
async function redisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis not configured');
  }

  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/${command.join('/')}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Sliding window rate limiter using Redis
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @param functionName - Name of the function being rate limited
 * @returns {allowed: boolean, remaining: number, resetAt: number}
 */
export async function checkRateLimit(
  identifier: string,
  functionName: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  // Skip if rate limiting is not configured
  if (!isRateLimitingEnabled()) {
    return {
      allowed: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
      limit: 999,
    };
  }

  const limit = getRateLimit(functionName);
  const key = getRateLimitKey(identifier, functionName);
  const now = Date.now();
  const windowStart = now - limit.window * 1000;

  try {
    // Redis pipeline for atomic operations:
    // 1. Remove old entries outside window
    // 2. Count current entries
    // 3. Add new entry if allowed
    // 4. Set expiration

    // Remove entries older than window
    await redisCommand(['ZREMRANGEBYSCORE', key, '0', windowStart.toString()]);

    // Count current entries
    const count = await redisCommand(['ZCARD', key]);

    const allowed = count < limit.requests;
    const remaining = Math.max(0, limit.requests - count - (allowed ? 1 : 0));
    const resetAt = now + limit.window * 1000;

    if (allowed) {
      // Add current request to sorted set
      await redisCommand(['ZADD', key, now.toString(), `${now}-${crypto.randomUUID()}`]);

      // Set expiration (window + buffer)
      await redisCommand(['EXPIRE', key, (limit.window + 10).toString()]);
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: limit.requests,
    };
  } catch (error) {
    console.error('❌ Rate limit check failed:', error);

    // Fail open - allow request if Redis is down
    // Better to allow traffic than break service
    return {
      allowed: true,
      remaining: 0,
      resetAt: now + 60000,
      limit: limit.requests,
    };
  }
}

/**
 * Extract identifier from request (IP address or API key)
 */
export function getIdentifier(req: Request): string {
  // Try to get IP from various headers (for proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare

  // Use first available
  const ip = cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'unknown';

  // For authenticated requests, combine with user ID for better tracking
  const auth = req.headers.get('authorization');
  if (auth) {
    // Extract user ID from JWT (basic parsing, not full verification)
    try {
      const token = auth.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return `user:${payload.sub}:${ip}`;
      }
    } catch {
      // If JWT parsing fails, just use IP
    }
  }

  return `ip:${ip}`;
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(
  resetAt: number,
  origin: string | null
): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
        'Access-Control-Allow-Origin': origin || '*',
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: { remaining: number; resetAt: number; limit: number }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
