// ===========================================
// SHARED SENTRY ERROR TRACKING
// ===========================================
// Lightweight Sentry integration for Edge Functions
// Uses Sentry HTTP API for error reporting

const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
const SENTRY_ENVIRONMENT = Deno.env.get('SENTRY_ENVIRONMENT') || 'development';
const SENTRY_RELEASE = Deno.env.get('SENTRY_RELEASE') || '1.0.0';

// Parse Sentry DSN to extract project details
function parseSentryDSN(dsn: string) {
  try {
    const url = new URL(dsn);
    const pathMatch = url.pathname.match(/^\/(\d+)$/);
    const projectId = pathMatch ? pathMatch[1] : null;

    return {
      protocol: url.protocol.replace(':', ''),
      publicKey: url.username,
      host: url.host,
      projectId,
      storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/`,
    };
  } catch {
    return null;
  }
}

interface SentryContext {
  functionName?: string;
  userId?: string;
  hotelId?: string;
  requestId?: string;
  extra?: Record<string, any>;
}

/**
 * Capture error and send to Sentry
 * @param error - Error object or message
 * @param context - Additional context for the error
 */
export async function captureError(
  error: Error | string,
  context?: SentryContext
): Promise<void> {
  // Skip if Sentry is not configured
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured, skipping error capture');
    return;
  }

  const parsedDSN = parseSentryDSN(SENTRY_DSN);
  if (!parsedDSN) {
    console.error('❌ Invalid Sentry DSN format');
    return;
  }

  try {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Build Sentry event payload
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: Math.floor(Date.now() / 1000),
      platform: 'javascript',
      sdk: {
        name: 'sentry.edge-functions',
        version: '1.0.0',
      },
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      server_name: 'edge-function',
      exception: {
        values: [
          {
            type: errorObj.name || 'Error',
            value: errorObj.message,
            stacktrace: errorObj.stack ? {
              frames: parseStackTrace(errorObj.stack),
            } : undefined,
          },
        ],
      },
      level: 'error',
      tags: {
        function_name: context?.functionName,
        environment: SENTRY_ENVIRONMENT,
      },
      user: context?.userId ? {
        id: context.userId,
      } : undefined,
      contexts: {
        hotel: context?.hotelId ? {
          hotel_id: context.hotelId,
        } : undefined,
        request: context?.requestId ? {
          request_id: context.requestId,
        } : undefined,
      },
      extra: context?.extra || {},
    };

    // Send to Sentry
    const response = await fetch(parsedDSN.storeUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsedDSN.publicKey}, sentry_client=sentry.edge-functions/1.0.0`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error(`❌ Failed to send error to Sentry: ${response.status}`);
    } else {
      console.log(`✅ Error captured in Sentry: ${event.event_id}`);
    }
  } catch (sentryError) {
    // Don't let Sentry errors break the function
    console.error('❌ Error sending to Sentry:', sentryError);
  }
}

/**
 * Parse stack trace into Sentry format
 */
function parseStackTrace(stack: string) {
  const lines = stack.split('\n').slice(1); // Skip first line (error message)

  return lines.map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
      };
    }

    const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
    if (simpleMatch) {
      return {
        filename: simpleMatch[1],
        lineno: parseInt(simpleMatch[2], 10),
        colno: parseInt(simpleMatch[3], 10),
      };
    }

    return {
      function: line.trim(),
    };
  }).filter(frame => frame.function || frame.filename);
}

/**
 * Capture message (non-error) to Sentry
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: SentryContext
): Promise<void> {
  if (!SENTRY_DSN) {
    return;
  }

  const parsedDSN = parseSentryDSN(SENTRY_DSN);
  if (!parsedDSN) {
    return;
  }

  try {
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: Math.floor(Date.now() / 1000),
      platform: 'javascript',
      sdk: {
        name: 'sentry.edge-functions',
        version: '1.0.0',
      },
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      message: {
        formatted: message,
      },
      level,
      tags: {
        function_name: context?.functionName,
        environment: SENTRY_ENVIRONMENT,
      },
      user: context?.userId ? {
        id: context.userId,
      } : undefined,
      extra: context?.extra || {},
    };

    await fetch(parsedDSN.storeUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsedDSN.publicKey}, sentry_client=sentry.edge-functions/1.0.0`,
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail
  }
}

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN && !!parseSentryDSN(SENTRY_DSN);
}
