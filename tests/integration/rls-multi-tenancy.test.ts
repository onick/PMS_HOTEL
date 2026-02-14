import { test, expect } from '@playwright/test';
import { createTestUser, supabase } from '../helpers/auth.helper';
import { createTestHotel, createTestGuest, createTestReservation, cleanupTestData } from '../helpers/test-data.helper';

const ENABLE_LEGACY_SUPABASE_TESTS = process.env.ENABLE_LEGACY_SUPABASE_TESTS === 'true';

/**
 * PRUEBA CRÍTICA #1: RLS Multi-tenancy
 * 
 * Objetivo: Verificar que las políticas RLS (Row Level Security) previenen
 * acceso cross-tenant entre hoteles diferentes.
 * 
 * Riesgo Mitigado: Violación GDPR/CCPA - Multas hasta €20M
 */

test.describe('RLS Multi-tenancy Security', () => {
  test.skip(!ENABLE_LEGACY_SUPABASE_TESTS, 'Legacy Supabase tests disabled. Set ENABLE_LEGACY_SUPABASE_TESTS=true to run.');
  let hotelA_id: string;
  let hotelB_id: string;
  let userA_id: string;
  let userB_id: string;
  let guestA_id: string;
  let guestB_id: string;
  let reservationA_id: string;
  let reservationB_id: string;

  test.beforeAll(async () => {
    // Crear Usuario A y Hotel A
    const userA = await createTestUser('hotel-a@test.com', 'TestPass123!');
    userA_id = userA.user!.id;
    
    const hotelA = await createTestHotel('Hotel A Test', userA_id);
    hotelA_id = hotelA.id;
    
    const guestA = await createTestGuest(hotelA_id, 'guest-a@test.com');
    guestA_id = guestA.id;
    
    const reservationA = await createTestReservation(hotelA_id, guestA_id);
    reservationA_id = reservationA.id;

    // Crear Usuario B y Hotel B
    const userB = await createTestUser('hotel-b@test.com', 'TestPass123!');
    userB_id = userB.user!.id;
    
    const hotelB = await createTestHotel('Hotel B Test', userB_id);
    hotelB_id = hotelB.id;
    
    const guestB = await createTestGuest(hotelB_id, 'guest-b@test.com');
    guestB_id = guestB.id;
    
    const reservationB = await createTestReservation(hotelB_id, guestB_id);
    reservationB_id = reservationB.id;
  });

  test.afterAll(async () => {
    // Cleanup
    await cleanupTestData(hotelA_id);
    await cleanupTestData(hotelB_id);
  });

  test('Usuario de Hotel A NO puede ver huéspedes de Hotel B', async () => {
    // Login como Usuario A
    const { data: sessionA } = await supabase.auth.signInWithPassword({
      email: 'hotel-a@test.com',
      password: 'TestPass123!',
    });

    expect(sessionA.session).toBeTruthy();

    // Intentar acceder a huésped de Hotel B
    const { data: guestsB, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestB_id)
      .single();

    // RLS debe bloquear el acceso
    expect(guestsB).toBeNull();
    expect(error).toBeTruthy();

    await supabase.auth.signOut();
  });

  test('Usuario de Hotel A NO puede ver reservas de Hotel B', async () => {
    const { data: sessionA } = await supabase.auth.signInWithPassword({
      email: 'hotel-a@test.com',
      password: 'TestPass123!',
    });

    expect(sessionA.session).toBeTruthy();

    // Intentar acceder a reserva de Hotel B
    const { data: reservationsB, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationB_id)
      .single();

    expect(reservationsB).toBeNull();
    expect(error).toBeTruthy();

    await supabase.auth.signOut();
  });

  test('Usuario de Hotel A NO puede modificar datos de Hotel B', async () => {
    const { data: sessionA } = await supabase.auth.signInWithPassword({
      email: 'hotel-a@test.com',
      password: 'TestPass123!',
    });

    expect(sessionA.session).toBeTruthy();

    // Intentar actualizar huésped de Hotel B
    const { error } = await supabase
      .from('guests')
      .update({ first_name: 'HACKED' })
      .eq('id', guestB_id);

    expect(error).toBeTruthy();

    // Verificar que NO se modificó
    await supabase.auth.signOut();
    const { data: sessionB } = await supabase.auth.signInWithPassword({
      email: 'hotel-b@test.com',
      password: 'TestPass123!',
    });

    const { data: guestB } = await supabase
      .from('guests')
      .select('first_name')
      .eq('id', guestB_id)
      .single();

    expect(guestB?.first_name).toBe('Test'); // NO debe ser 'HACKED'

    await supabase.auth.signOut();
  });

  test('Usuario de Hotel A puede ver SUS PROPIOS datos', async () => {
    const { data: sessionA } = await supabase.auth.signInWithPassword({
      email: 'hotel-a@test.com',
      password: 'TestPass123!',
    });

    expect(sessionA.session).toBeTruthy();

    // Debe poder acceder a sus propios huéspedes
    const { data: guestsA, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestA_id)
      .single();

    expect(guestsA).toBeTruthy();
    expect(guestsA?.id).toBe(guestA_id);
    expect(error).toBeNull();

    await supabase.auth.signOut();
  });

  test('Query amplio NO retorna datos de otros hoteles', async () => {
    const { data: sessionA } = await supabase.auth.signInWithPassword({
      email: 'hotel-a@test.com',
      password: 'TestPass123!',
    });

    expect(sessionA.session).toBeTruthy();

    // Query SIN filtro de hotel_id
    const { data: allGuests } = await supabase
      .from('guests')
      .select('*');

    // Debe retornar SOLO huéspedes de Hotel A
    expect(allGuests?.length).toBe(1);
    expect(allGuests?.[0].hotel_id).toBe(hotelA_id);
    expect(allGuests?.find(g => g.hotel_id === hotelB_id)).toBeUndefined();

    await supabase.auth.signOut();
  });
});
