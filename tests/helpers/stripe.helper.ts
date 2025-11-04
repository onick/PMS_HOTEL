/**
 * Helper para simular eventos de Stripe Webhooks
 */

export const STRIPE_PRICE_IDS = {
  BASIC: 'price_1SMoZNJiUN4FeEoTJJwi21Tm',
  PRO: 'price_1SMoayJiUN4FeEoTX4MVfEgz',
  ENTERPRISE: 'price_1SMobqJiUN4FeEoTbTXzXhwU',
};

/**
 * Simula un evento de Stripe: customer.subscription.created
 */
export function createSubscriptionCreatedEvent(
  customerId: string,
  subscriptionId: string,
  priceId: string,
  hotelId: string
) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [
            {
              price: {
                id: priceId,
              },
            },
          ],
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 días
        cancel_at_period_end: false,
        metadata: {
          hotel_id: hotelId,
        },
      },
    },
  };
}

/**
 * Simula un evento: customer.subscription.updated
 */
export function createSubscriptionUpdatedEvent(
  customerId: string,
  subscriptionId: string,
  oldPriceId: string,
  newPriceId: string,
  hotelId: string
) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items: {
          data: [
            {
              price: {
                id: newPriceId,
              },
            },
          ],
        },
        metadata: {
          hotel_id: hotelId,
        },
      },
      previous_attributes: {
        items: {
          data: [
            {
              price: {
                id: oldPriceId,
              },
            },
          ],
        },
      },
    },
  };
}

/**
 * Simula un evento: customer.subscription.deleted
 */
export function createSubscriptionDeletedEvent(
  customerId: string,
  subscriptionId: string,
  hotelId: string
) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        status: 'canceled',
        metadata: {
          hotel_id: hotelId,
        },
      },
    },
  };
}

/**
 * Simula un evento: invoice.payment_succeeded
 */
export function createPaymentSucceededEvent(
  customerId: string,
  subscriptionId: string,
  hotelId: string
) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        customer: customerId,
        subscription: subscriptionId,
        status: 'paid',
        amount_paid: 2900, // $29.00 en centavos
        metadata: {
          hotel_id: hotelId,
        },
      },
    },
  };
}

/**
 * Simula un evento: invoice.payment_failed
 */
export function createPaymentFailedEvent(
  customerId: string,
  subscriptionId: string,
  hotelId: string
) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'invoice.payment_failed',
    data: {
      object: {
        customer: customerId,
        subscription: subscriptionId,
        status: 'open',
        metadata: {
          hotel_id: hotelId,
        },
      },
    },
  };
}

/**
 * Helper para enviar webhook a Edge Function
 */
export async function sendWebhookToEdgeFunction(event: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const webhookUrl = `${supabaseUrl}/functions/v1/stripe-subscription-webhook`;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'test_signature', // En producción, firmar correctamente
    },
    body: JSON.stringify(event),
  });

  return response;
}
