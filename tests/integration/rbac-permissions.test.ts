import { test, expect } from '@playwright/test';
import { createTestUser, supabase } from '../helpers/auth.helper';
import { createTestHotel, cleanupTestData } from '../helpers/test-data.helper';

/**
 * PRUEBA CRÍTICA #4: RBAC Permissions
 * 
 * Objetivo: Verificar que el sistema de roles y permisos previene
 * escalación de privilegios y acceso no autorizado.
 * 
 * Riesgo Mitigado: Sabotaje interno, fraude, y acceso a datos confidenciales
 */

test.describe('RBAC Permissions', () => {
  let hotelId: string;
  let ownerUserId: string;
  let managerUserId: string;
  let receptionUserId: string;
  let housekeepingUserId: string;

  const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    HOTEL_OWNER: 'HOTEL_OWNER',
    MANAGER: 'MANAGER',
    RECEPTION: 'RECEPTION',
    HOUSEKEEPING: 'HOUSEKEEPING',
    SALES: 'SALES',
  };

  test.beforeAll(async () => {
    // Crear owner
    const owner = await createTestUser('owner@test.com', 'TestPass123!');
    ownerUserId = owner.user!.id;
    
    const hotel = await createTestHotel('RBAC Test Hotel', ownerUserId);
    hotelId = hotel.id;

    // Asignar rol HOTEL_OWNER
    await supabase.from('user_roles').insert({
      user_id: ownerUserId,
      hotel_id: hotelId,
      role: ROLES.HOTEL_OWNER,
    });

    // Crear manager
    const manager = await createTestUser('manager@test.com', 'TestPass123!');
    managerUserId = manager.user!.id;
    await supabase.from('user_roles').insert({
      user_id: managerUserId,
      hotel_id: hotelId,
      role: ROLES.MANAGER,
    });

    // Crear recepcionista
    const reception = await createTestUser('reception@test.com', 'TestPass123!');
    receptionUserId = reception.user!.id;
    await supabase.from('user_roles').insert({
      user_id: receptionUserId,
      hotel_id: hotelId,
      role: ROLES.RECEPTION,
    });

    // Crear personal de limpieza
    const housekeeping = await createTestUser('housekeeping@test.com', 'TestPass123!');
    housekeepingUserId = housekeeping.user!.id;
    await supabase.from('user_roles').insert({
      user_id: housekeepingUserId,
      hotel_id: hotelId,
      role: ROLES.HOUSEKEEPING,
    });
  });

  test.afterAll(async () => {
    await cleanupTestData(hotelId);
  });

  test('RECEPTION NO puede acceder a módulo de Billing', async () => {
    // Login como recepcionista
    await supabase.auth.signInWithPassword({
      email: 'reception@test.com',
      password: 'TestPass123!',
    });

    // Intentar acceder a folios (Billing)
    const { data: folios, error } = await supabase
      .from('folios')
      .select('*')
      .eq('hotel_id', hotelId);

    // Debe ser bloqueado por RLS
    expect(error).toBeTruthy();
    expect(folios).toEqual([]);

    await supabase.auth.signOut();
  });

  test('HOUSEKEEPING NO puede ver reservas', async () => {
    await supabase.auth.signInWithPassword({
      email: 'housekeeping@test.com',
      password: 'TestPass123!',
    });

    // Intentar acceder a reservas
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('hotel_id', hotelId);

    expect(error).toBeTruthy();
    expect(reservations).toEqual([]);

    await supabase.auth.signOut();
  });

  test('RECEPTION NO puede eliminar usuarios', async () => {
    await supabase.auth.signInWithPassword({
      email: 'reception@test.com',
      password: 'TestPass123!',
    });

    // Intentar eliminar usuario
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', housekeepingUserId);

    expect(error).toBeTruthy();

    await supabase.auth.signOut();
  });

  test('MANAGER puede ver reservas pero NO eliminar usuarios', async () => {
    await supabase.auth.signInWithPassword({
      email: 'manager@test.com',
      password: 'TestPass123!',
    });

    // DEBE poder ver reservas
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .eq('hotel_id', hotelId);

    expect(reservationsError).toBeNull();

    // NO debe poder eliminar usuarios
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', receptionUserId);

    expect(deleteError).toBeTruthy();

    await supabase.auth.signOut();
  });

  test('HOTEL_OWNER puede eliminar usuarios', async () => {
    await supabase.auth.signInWithPassword({
      email: 'owner@test.com',
      password: 'TestPass123!',
    });

    // Crear usuario temporal para eliminar
    const tempUser = await createTestUser('temp@test.com', 'TestPass123!');
    await supabase.from('user_roles').insert({
      user_id: tempUser.user!.id,
      hotel_id: hotelId,
      role: ROLES.RECEPTION,
    });

    // DEBE poder eliminar
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', tempUser.user!.id);

    expect(error).toBeNull();

    await supabase.auth.signOut();
  });

  test('Usuario NO puede cambiar su propio rol', async () => {
    await supabase.auth.signInWithPassword({
      email: 'reception@test.com',
      password: 'TestPass123!',
    });

    // Intentar escalarse a MANAGER
    const { error } = await supabase
      .from('user_roles')
      .update({ role: ROLES.MANAGER })
      .eq('user_id', receptionUserId);

    expect(error).toBeTruthy();

    // Verificar que rol no cambió
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', receptionUserId)
      .single();

    expect(userRole?.role).toBe(ROLES.RECEPTION); // Sigue siendo RECEPTION

    await supabase.auth.signOut();
  });

  test('RECEPTION puede crear reservas (dentro de su scope)', async () => {
    await supabase.auth.signInWithPassword({
      email: 'reception@test.com',
      password: 'TestPass123!',
    });

    // Crear huésped
    const { data: guest } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        first_name: 'Test',
        last_name: 'Guest',
        email: 'rbac-test@test.com',
        phone: '+1234567890',
      })
      .select()
      .single();

    expect(guest).toBeTruthy();

    // Crear reserva
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 1);

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest!.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'RESERVED',
        total_amount: 100.00,
        adults: 1,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(reservation).toBeTruthy();

    await supabase.auth.signOut();
  });

  test('HOUSEKEEPING puede actualizar estado de habitaciones', async () => {
    await supabase.auth.signInWithPassword({
      email: 'housekeeping@test.com',
      password: 'TestPass123!',
    });

    // Crear habitación
    const { data: room } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '201',
        status: 'DIRTY',
        floor: 2,
      })
      .select()
      .single();

    // DEBE poder cambiar estado a CLEAN
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'CLEAN' })
      .eq('id', room!.id);

    expect(error).toBeNull();

    // Verificar cambio
    const { data: updatedRoom } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', room!.id)
      .single();

    expect(updatedRoom?.status).toBe('CLEAN');

    await supabase.auth.signOut();
  });

  test('Usuario de Hotel A NO puede cambiar roles en Hotel B', async () => {
    // Crear Hotel B
    const ownerB = await createTestUser('owner-b@test.com', 'TestPass123!');
    const hotelB = await createTestHotel('Hotel B', ownerB.user!.id);

    await supabase.from('user_roles').insert({
      user_id: ownerB.user!.id,
      hotel_id: hotelB.id,
      role: ROLES.HOTEL_OWNER,
    });

    // Login como Owner de Hotel A
    await supabase.auth.signInWithPassword({
      email: 'owner@test.com',
      password: 'TestPass123!',
    });

    // Crear usuario en Hotel B
    const userB = await createTestUser('user-b@test.com', 'TestPass123!');
    await supabase.from('user_roles').insert({
      user_id: userB.user!.id,
      hotel_id: hotelB.id,
      role: ROLES.RECEPTION,
    });

    // Intentar cambiar rol de usuario en Hotel B
    const { error } = await supabase
      .from('user_roles')
      .update({ role: ROLES.MANAGER })
      .eq('user_id', userB.user!.id)
      .eq('hotel_id', hotelB.id);

    expect(error).toBeTruthy(); // RLS debe bloquear

    // Cleanup Hotel B
    await supabase.auth.signOut();
    await cleanupTestData(hotelB.id);
  });

  test('Permisos granulares: RECEPTION puede check-in pero NO puede ver reportes financieros', async () => {
    await supabase.auth.signInWithPassword({
      email: 'reception@test.com',
      password: 'TestPass123!',
    });

    // PUEDE hacer check-in (actualizar reserva)
    const { data: guest } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        first_name: 'CheckIn',
        last_name: 'Test',
        email: 'checkin-rbac@test.com',
        phone: '+1234567890',
      })
      .select()
      .single();

    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 1);

    const { data: reservation } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest!.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'RESERVED',
        total_amount: 100.00,
        adults: 1,
      })
      .select()
      .single();

    // Check-in (cambiar estado)
    const { error: checkinError } = await supabase
      .from('reservations')
      .update({ status: 'CHECKED_IN' })
      .eq('id', reservation!.id);

    expect(checkinError).toBeNull(); // DEBE funcionar

    // NO puede ver reportes financieros (folios)
    const { data: folios, error: foliosError } = await supabase
      .from('folios')
      .select('*')
      .eq('hotel_id', hotelId);

    expect(foliosError).toBeTruthy(); // DEBE fallar
    expect(folios).toEqual([]);

    await supabase.auth.signOut();
  });
});

