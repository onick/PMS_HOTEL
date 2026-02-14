import { test, expect } from '@playwright/test';
import { createTestUser, supabase } from '../helpers/auth.helper';
import { createTestHotel, cleanupTestData } from '../helpers/test-data.helper';
import {
  STRIPE_PRICE_IDS,
  createSubscriptionCreatedEvent,
  createSubscriptionUpdatedEvent,
  createSubscriptionDeletedEvent,
  createPaymentSucceededEvent,
  createPaymentFailedEvent,
  sendWebhookToEdgeFunction,
} from '../helpers/stripe.helper';

const ENABLE_LEGACY_SUPABASE_TESTS = process.env.ENABLE_LEGACY_SUPABASE_TESTS === 'true';

/**
 * PRUEBA CRÍTICA #2: Stripe Webhooks Synchronization
 * 
 * Objetivo: Verificar que los webhooks de Stripe sincronizan correctamente
 * el estado de suscripciones entre Stripe y la base de datos.
 * 
 * Riesgo Mitigado: Desincronización Stripe-DB = $10K-50K pérdidas mensuales
 */

test.describe('Stripe Webhooks Synchronization', () => {
  test.skip(!ENABLE_LEGACY_SUPABASE_TESTS, 'Legacy Supabase tests disabled. Set ENABLE_LEGACY_SUPABASE_TESTS=true to run.');
  let hotelId: string;
  let userId: string;
  const customerId = 'cus_test_' + Date.now();
  const subscriptionId = 'sub_test_' + Date.now();

  test.beforeAll(async () => {
    // Crear hotel de prueba
    const user = await createTestUser('webhook-test@test.com', 'TestPass123!');
    userId = user.user!.id;
    
    const hotel = await createTestHotel('Webhook Test Hotel', userId);
    hotelId = hotel.id;

    // Crear suscripción inicial en DB
    await supabase.from('subscriptions').insert({
      hotel_id: hotelId,
      plan: 'FREE',
      status: 'TRIAL',
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
    });
  });

  test.afterAll(async () => {
    await cleanupTestData(hotelId);
  });

  test('Webhook subscription.created actualiza DB correctamente', async () => {
    // Simular webhook de Stripe: subscription created
    const event = createSubscriptionCreatedEvent(
      customerId,
      subscriptionId,
      STRIPE_PRICE_IDS.BASIC,
      hotelId
    );

    const response = await sendWebhookToEdgeFunction(event);
    expect(response.ok).toBeTruthy();

    // Esperar procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que DB se actualizó
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    expect(subscription?.stripe_subscription_id).toBe(subscriptionId);
    expect(subscription?.plan).toBe('BASIC');
    expect(subscription?.status).toBe('ACTIVE');
  });

  test('Webhook subscription.updated cambia plan correctamente', async () => {
    // Simular cambio de BASIC a PRO
    const event = createSubscriptionUpdatedEvent(
      customerId,
      subscriptionId,
      STRIPE_PRICE_IDS.BASIC,
      STRIPE_PRICE_IDS.PRO,
      hotelId
    );

    const response = await sendWebhookToEdgeFunction(event);
    expect(response.ok).toBeTruthy();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    expect(subscription?.plan).toBe('PRO');
    expect(subscription?.status).toBe('ACTIVE');
  });

  test('Webhook subscription.deleted marca como cancelada', async () => {
    const event = createSubscriptionDeletedEvent(
      customerId,
      subscriptionId,
      hotelId
    );

    const response = await sendWebhookToEdgeFunction(event);
    expect(response.ok).toBeTruthy();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    expect(subscription?.status).toBe('CANCELED');
  });

  test('Webhook payment_failed marca como PAST_DUE', async () => {
    // Restaurar suscripción activa
    await supabase
      .from('subscriptions')
      .update({ status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    const event = createPaymentFailedEvent(
      customerId,
      subscriptionId,
      hotelId
    );

    const response = await sendWebhookToEdgeFunction(event);
    expect(response.ok).toBeTruthy();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    expect(subscription?.status).toBe('PAST_DUE');
  });

  test('Webhook duplicado es idempotente (no crea duplicados)', async () => {
    // Enviar el MISMO evento 3 veces
    const event = createPaymentSucceededEvent(
      customerId,
      subscriptionId,
      hotelId
    );

    await sendWebhookToEdgeFunction(event);
    await sendWebhookToEdgeFunction(event);
    await sendWebhookToEdgeFunction(event);

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verificar que solo hay 1 suscripción
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId);

    expect(subscriptions?.length).toBe(1);
  });

  test('Race condition: Webhook vs actualización manual', async () => {
    // Simular actualización manual
    const manualUpdate = supabase
      .from('subscriptions')
      .update({ plan: 'ENTERPRISE' })
      .eq('hotel_id', hotelId);

    // Simular webhook simultáneo
    const webhookEvent = createSubscriptionUpdatedEvent(
      customerId,
      subscriptionId,
      STRIPE_PRICE_IDS.PRO,
      STRIPE_PRICE_IDS.BASIC,
      hotelId
    );
    const webhookUpdate = sendWebhookToEdgeFunction(webhookEvent);

    // Ejecutar ambos al mismo tiempo
    await Promise.all([manualUpdate, webhookUpdate]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // El webhook debe ganar (source of truth es Stripe)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    // Stripe dice BASIC, debe ser BASIC (no ENTERPRISE)
    expect(subscription?.plan).toBe('BASIC');
  });

  test('Límites de plan se actualizan inmediatamente después de upgrade', async () => {
    // Cambiar de BASIC (20 rooms) a PRO (50 rooms)
    const event = createSubscriptionUpdatedEvent(
      customerId,
      subscriptionId,
      STRIPE_PRICE_IDS.BASIC,
      STRIPE_PRICE_IDS.PRO,
      hotelId
    );

    await sendWebhookToEdgeFunction(event);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    expect(subscription?.plan).toBe('PRO');

    // Intentar crear habitación #21 (ahora debería permitirse)
    // En BASIC límite es 20, en PRO es 50
    const { error } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '021',
        status: 'CLEAN',
        floor: 2,
      });

    // No debe haber error porque PRO permite hasta 50
    expect(error).toBeNull();
  });
});
