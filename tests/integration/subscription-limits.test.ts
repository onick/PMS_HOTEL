import { test, expect } from '@playwright/test';
import { createTestUser, supabase } from '../helpers/auth.helper';
import { createTestHotel, createTestGuest, cleanupTestData } from '../helpers/test-data.helper';

/**
 * PRUEBA CRÍTICA #5: Subscription Limits Enforcement
 * 
 * Objetivo: Verificar que los límites de cada plan se aplican correctamente
 * tanto en frontend como en backend.
 * 
 * Riesgo Mitigado: Uso fraudulento de features premium sin pagar
 * ($29-$170/mes pérdida por hotel)
 */

test.describe('Subscription Limits Enforcement', () => {
  let hotelId: string;
  let userId: string;

  // Límites por plan según PLAN_LIMITS
  const PLAN_LIMITS = {
    FREE: { maxRooms: 10, maxUsers: 3, maxReservationsPerMonth: 50 },
    BASIC: { maxRooms: 20, maxUsers: 5, maxReservationsPerMonth: 200 },
    PRO: { maxRooms: 50, maxUsers: 15, maxReservationsPerMonth: 1000 },
    ENTERPRISE: { maxRooms: -1, maxUsers: -1, maxReservationsPerMonth: -1 },
  };

  test.beforeAll(async () => {
    const user = await createTestUser('limits-test@test.com', 'TestPass123!');
    userId = user.user!.id;
    
    const hotel = await createTestHotel('Limits Test Hotel', userId);
    hotelId = hotel.id;
  });

  test.afterAll(async () => {
    await cleanupTestData(hotelId);
  });

  test.beforeEach(async () => {
    // Resetear a plan FREE antes de cada test
    await supabase
      .from('subscriptions')
      .upsert({
        hotel_id: hotelId,
        plan: 'FREE',
        status: 'TRIAL',
      });

    // Limpiar habitaciones y usuarios previos
    await supabase.from('rooms').delete().eq('hotel_id', hotelId);
    await supabase.from('reservations').delete().eq('hotel_id', hotelId);
  });

  test('FREE plan: NO permite crear más de 10 habitaciones', async () => {
    // Crear 10 habitaciones (límite FREE)
    for (let i = 1; i <= 10; i++) {
      const { error } = await supabase
        .from('rooms')
        .insert({
          hotel_id: hotelId,
          room_number: `00${i}`,
          status: 'CLEAN',
          floor: 1,
        });
      expect(error).toBeNull();
    }

    // Intentar crear la #11 (debe fallar)
    const { error: limitError } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '011',
        status: 'CLEAN',
        floor: 1,
      });

    // Debe ser bloqueado por RLS policy o trigger
    expect(limitError).toBeTruthy();
  });

  test('BASIC plan: Permite hasta 20 habitaciones', async () => {
    // Upgrade a BASIC
    await supabase
      .from('subscriptions')
      .update({ plan: 'BASIC', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    // Crear 20 habitaciones
    for (let i = 1; i <= 20; i++) {
      const { error } = await supabase
        .from('rooms')
        .insert({
          hotel_id: hotelId,
          room_number: String(i).padStart(3, '0'),
          status: 'CLEAN',
          floor: Math.floor(i / 10) + 1,
        });
      expect(error).toBeNull();
    }

    // Verificar que hay exactamente 20
    const { data: rooms, count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('hotel_id', hotelId);

    expect(count).toBe(20);

    // Intentar crear la #21 (debe fallar)
    const { error: limitError } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '021',
        status: 'CLEAN',
        floor: 3,
      });

    expect(limitError).toBeTruthy();
  });

  test('PRO plan: Permite hasta 50 habitaciones', async () => {
    // Upgrade a PRO
    await supabase
      .from('subscriptions')
      .update({ plan: 'PRO', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    // Crear 50 habitaciones (solo verificamos que permite más de 20)
    for (let i = 1; i <= 50; i++) {
      const { error } = await supabase
        .from('rooms')
        .insert({
          hotel_id: hotelId,
          room_number: String(i).padStart(3, '0'),
          status: 'CLEAN',
          floor: Math.floor(i / 10) + 1,
        });
      expect(error).toBeNull();
    }

    const { count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('hotel_id', hotelId);

    expect(count).toBe(50);
  });

  test('ENTERPRISE plan: Habitaciones ilimitadas', async () => {
    // Upgrade a ENTERPRISE
    await supabase
      .from('subscriptions')
      .update({ plan: 'ENTERPRISE', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    // Crear 100 habitaciones (más del límite PRO)
    for (let i = 1; i <= 100; i++) {
      const { error } = await supabase
        .from('rooms')
        .insert({
          hotel_id: hotelId,
          room_number: String(i).padStart(3, '0'),
          status: 'CLEAN',
          floor: Math.floor(i / 10) + 1,
        });
      expect(error).toBeNull();
    }

    const { count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('hotel_id', hotelId);

    expect(count).toBe(100);
  });

  test('Upgrade inmediato: De BASIC a PRO expande límites', async () => {
    // Empezar en BASIC (20 habitaciones)
    await supabase
      .from('subscriptions')
      .update({ plan: 'BASIC', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    // Crear 20 habitaciones
    for (let i = 1; i <= 20; i++) {
      await supabase.from('rooms').insert({
        hotel_id: hotelId,
        room_number: String(i).padStart(3, '0'),
        status: 'CLEAN',
        floor: 1,
      });
    }

    // Intentar crear #21 (debe fallar en BASIC)
    const { error: basicLimitError } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '021',
        status: 'CLEAN',
        floor: 2,
      });
    expect(basicLimitError).toBeTruthy();

    // Upgrade a PRO
    await supabase
      .from('subscriptions')
      .update({ plan: 'PRO', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    // Esperar 500ms para propagación
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ahora DEBE permitir crear #21
    const { error: proError } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '021',
        status: 'CLEAN',
        floor: 2,
      });
    expect(proError).toBeNull();
  });

  test('Downgrade: De PRO a BASIC con 30 habitaciones existentes', async () => {
    // Empezar en PRO y crear 30 habitaciones
    await supabase
      .from('subscriptions')
      .update({ plan: 'PRO', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    for (let i = 1; i <= 30; i++) {
      await supabase.from('rooms').insert({
        hotel_id: hotelId,
        room_number: String(i).padStart(3, '0'),
        status: 'CLEAN',
        floor: 1,
      });
    }

    // Downgrade a BASIC (límite 20)
    await supabase
      .from('subscriptions')
      .update({ plan: 'BASIC', status: 'ACTIVE' })
      .eq('hotel_id', hotelId);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Las 30 habitaciones existentes deben permanecer
    const { count: existingCount } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('hotel_id', hotelId);
    expect(existingCount).toBe(30);

    // Pero NO debe permitir crear nuevas
    const { error } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '031',
        status: 'CLEAN',
        floor: 2,
      });
    expect(error).toBeTruthy();
  });

  test('FREE plan: Límite de 50 reservas por mes', async () => {
    // Plan FREE
    await supabase
      .from('subscriptions')
      .update({ plan: 'FREE', status: 'TRIAL' })
      .eq('hotel_id', hotelId);

    // Crear un huésped
    const guest = await createTestGuest(hotelId, 'monthly-test@test.com');

    // Crear 50 reservas (límite FREE)
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const checkIn = new Date(now);
      checkIn.setDate(now.getDate() + i);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 1);

      const { error } = await supabase
        .from('reservations')
        .insert({
          hotel_id: hotelId,
          guest_id: guest.id,
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          status: 'RESERVED',
          total_amount: 100.00,
          adults: 2,
        });
      expect(error).toBeNull();
    }

    // Intentar crear la #51 (debe fallar)
    const checkIn = new Date(now);
    checkIn.setDate(now.getDate() + 51);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 1);

    const { error: limitError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'RESERVED',
        total_amount: 100.00,
        adults: 2,
      });

    expect(limitError).toBeTruthy();
  });

  test('Bypass de frontend: Request directo a API debe bloquearse', async () => {
    // Plan FREE con límite de 10 habitaciones
    await supabase
      .from('subscriptions')
      .update({ plan: 'FREE', status: 'TRIAL' })
      .eq('hotel_id', hotelId);

    // Crear 10 habitaciones
    for (let i = 1; i <= 10; i++) {
      await supabase.from('rooms').insert({
        hotel_id: hotelId,
        room_number: String(i).padStart(3, '0'),
        status: 'CLEAN',
        floor: 1,
      });
    }

    // Simular request directo (bypass del frontend)
    const { error } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '999',
        status: 'CLEAN',
        floor: 9,
      });

    // Backend DEBE bloquear aunque frontend no lo valide
    expect(error).toBeTruthy();
    expect(error?.message).toContain('limit');
  });
});

