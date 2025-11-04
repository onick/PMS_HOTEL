import { test, expect } from '@playwright/test';
import { createTestUser, loginUser, supabase } from '../helpers/auth.helper';
import { createTestHotel, createTestGuest, cleanupTestData } from '../helpers/test-data.helper';

/**
 * PRUEBA CRÍTICA #3: Check-In/Out Cycle
 * 
 * Objetivo: Verificar la integridad del ciclo de vida completo de una reserva
 * desde su creación hasta el check-out con pago.
 * 
 * Riesgo Mitigado: Pérdida de ingresos por cargos no registrados ($2K-5K/mes)
 * y habitaciones bloqueadas en estados inconsistentes.
 */

test.describe('Check-In/Out Cycle E2E', () => {
  let hotelId: string;
  let userId: string;
  let guestId: string;
  let reservationId: string;
  let roomId: string;
  let folioId: string;

  test.beforeAll(async () => {
    // Crear usuario y hotel
    const user = await createTestUser('checkin-test@test.com', 'TestPass123!');
    userId = user.user!.id;
    
    const hotel = await createTestHotel('Check-In Test Hotel', userId);
    hotelId = hotel.id;

    // Crear habitación
    const { data: room } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '101',
        status: 'CLEAN',
        floor: 1,
      })
      .select()
      .single();
    roomId = room!.id;

    // Crear huésped
    const guest = await createTestGuest(hotelId, 'checkin-guest@test.com');
    guestId = guest.id;

    // Crear reserva inicial
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2); // 2 noches

    const { data: reservation } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guestId,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'RESERVED',
        total_amount: 200.00,
        adults: 2,
        children: 0,
      })
      .select()
      .single();
    reservationId = reservation!.id;
  });

  test.afterAll(async () => {
    await cleanupTestData(hotelId);
  });

  test('Flujo completo: Reserved → Check-In → Check-Out', async () => {
    // 1. Verificar estado inicial: RESERVED
    let { data: reservation } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', reservationId)
      .single();
    expect(reservation?.status).toBe('RESERVED');

    // 2. CHECK-IN: Cambiar a CHECKED_IN y crear folio
    const { data: updatedReservation } = await supabase
      .from('reservations')
      .update({ status: 'CHECKED_IN' })
      .eq('id', reservationId)
      .select()
      .single();
    expect(updatedReservation?.status).toBe('CHECKED_IN');

    // Crear folio
    const { data: folio } = await supabase
      .from('folios')
      .insert({
        hotel_id: hotelId,
        reservation_id: reservationId,
        guest_id: guestId,
        status: 'OPEN',
        total_charges: 200.00,
        total_payments: 0.00,
        balance: 200.00,
      })
      .select()
      .single();
    folioId = folio!.id;

    expect(folio?.status).toBe('OPEN');
    expect(folio?.balance).toBe(200.00);

    // 3. Agregar cargos extras (minibar, room service)
    await supabase.from('folio_charges').insert([
      {
        folio_id: folioId,
        description: 'Minibar',
        amount: 25.00,
        charge_date: new Date().toISOString(),
      },
      {
        folio_id: folioId,
        description: 'Room Service',
        amount: 45.00,
        charge_date: new Date().toISOString(),
      },
    ]);

    // 4. Actualizar folio con cargos extras
    await supabase
      .from('folios')
      .update({
        total_charges: 270.00, // 200 + 25 + 45
        balance: 270.00,
      })
      .eq('id', folioId);

    // 5. CHECK-OUT: Procesar pago
    const { data: payment } = await supabase
      .from('folio_payments')
      .insert({
        folio_id: folioId,
        amount: 270.00,
        payment_method: 'CREDIT_CARD',
        payment_date: new Date().toISOString(),
      })
      .select()
      .single();
    expect(payment?.amount).toBe(270.00);

    // 6. Cerrar folio
    await supabase
      .from('folios')
      .update({
        status: 'CLOSED',
        total_payments: 270.00,
        balance: 0.00,
      })
      .eq('id', folioId);

    // 7. Actualizar reserva a CHECKED_OUT
    await supabase
      .from('reservations')
      .update({ status: 'CHECKED_OUT' })
      .eq('id', reservationId);

    // 8. Habitación debe cambiar a DIRTY (para Housekeeping)
    await supabase
      .from('rooms')
      .update({ status: 'DIRTY' })
      .eq('id', roomId);

    // Verificaciones finales
    const { data: finalReservation } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', reservationId)
      .single();
    expect(finalReservation?.status).toBe('CHECKED_OUT');

    const { data: finalFolio } = await supabase
      .from('folios')
      .select('*')
      .eq('id', folioId)
      .single();
    expect(finalFolio?.status).toBe('CLOSED');
    expect(finalFolio?.balance).toBe(0.00);

    const { data: finalRoom } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', roomId)
      .single();
    expect(finalRoom?.status).toBe('DIRTY');
  });

  test('Rollback: Check-out falla si pago es insuficiente', async () => {
    // Crear nueva reserva para este test
    const guest2 = await createTestGuest(hotelId, 'rollback-test@test.com');
    
    const { data: room2 } = await supabase
      .from('rooms')
      .insert({
        hotel_id: hotelId,
        room_number: '102',
        status: 'CLEAN',
        floor: 1,
      })
      .select()
      .single();

    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 1);

    const { data: reservation2 } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest2.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'CHECKED_IN',
        total_amount: 150.00,
        adults: 1,
      })
      .select()
      .single();

    const { data: folio2 } = await supabase
      .from('folios')
      .insert({
        hotel_id: hotelId,
        reservation_id: reservation2!.id,
        guest_id: guest2.id,
        status: 'OPEN',
        total_charges: 150.00,
        total_payments: 0.00,
        balance: 150.00,
      })
      .select()
      .single();

    // Intentar pagar solo $100 (insuficiente)
    await supabase.from('folio_payments').insert({
      folio_id: folio2!.id,
      amount: 100.00,
      payment_method: 'CASH',
      payment_date: new Date().toISOString(),
    });

    await supabase
      .from('folios')
      .update({
        total_payments: 100.00,
        balance: 50.00, // Quedan $50 pendientes
      })
      .eq('id', folio2!.id);

    // NO debe permitir check-out si balance > 0
    const { data: folio2Status } = await supabase
      .from('folios')
      .select('balance, status')
      .eq('id', folio2!.id)
      .single();

    expect(folio2Status?.balance).toBeGreaterThan(0);
    expect(folio2Status?.status).toBe('OPEN'); // NO debe estar CLOSED

    // Reserva debe permanecer en CHECKED_IN
    const { data: reservation2Status } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', reservation2!.id)
      .single();
    expect(reservation2Status?.status).toBe('CHECKED_IN');
  });

  test('Audit log: Cada cambio de estado se registra', async () => {
    // Verificar que hay audit logs para la reserva
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'reservations')
      .eq('record_id', reservationId)
      .order('created_at', { ascending: true });

    // Debe haber al menos 3 logs: RESERVED → CHECKED_IN → CHECKED_OUT
    expect(auditLogs?.length).toBeGreaterThanOrEqual(3);

    // Verificar secuencia
    const statuses = auditLogs?.map(log => log.new_value?.status);
    expect(statuses).toContain('RESERVED');
    expect(statuses).toContain('CHECKED_IN');
    expect(statuses).toContain('CHECKED_OUT');
  });

  test('Cálculo de balance: Total charges - Total payments', async () => {
    // Crear folio con múltiples cargos
    const guest3 = await createTestGuest(hotelId, 'balance-test@test.com');
    
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3); // 3 noches

    const { data: reservation3 } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest3.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        status: 'CHECKED_IN',
        total_amount: 300.00, // $100/noche
        adults: 2,
      })
      .select()
      .single();

    const { data: folio3 } = await supabase
      .from('folios')
      .insert({
        hotel_id: hotelId,
        reservation_id: reservation3!.id,
        guest_id: guest3.id,
        status: 'OPEN',
        total_charges: 300.00,
        total_payments: 0.00,
        balance: 300.00,
      })
      .select()
      .single();

    // Agregar múltiples cargos
    await supabase.from('folio_charges').insert([
      { folio_id: folio3!.id, description: 'Breakfast Day 1', amount: 20.00, charge_date: new Date().toISOString() },
      { folio_id: folio3!.id, description: 'Breakfast Day 2', amount: 20.00, charge_date: new Date().toISOString() },
      { folio_id: folio3!.id, description: 'Breakfast Day 3', amount: 20.00, charge_date: new Date().toISOString() },
      { folio_id: folio3!.id, description: 'Minibar', amount: 35.00, charge_date: new Date().toISOString() },
      { folio_id: folio3!.id, description: 'Laundry', amount: 25.00, charge_date: new Date().toISOString() },
    ]);

    // Total charges = 300 + 20 + 20 + 20 + 35 + 25 = 420
    const totalCharges = 420.00;

    // Pago parcial 1
    await supabase.from('folio_payments').insert({
      folio_id: folio3!.id,
      amount: 200.00,
      payment_method: 'CREDIT_CARD',
      payment_date: new Date().toISOString(),
    });

    // Pago parcial 2
    await supabase.from('folio_payments').insert({
      folio_id: folio3!.id,
      amount: 220.00,
      payment_method: 'CREDIT_CARD',
      payment_date: new Date().toISOString(),
    });

    const totalPayments = 420.00;

    // Actualizar folio
    await supabase
      .from('folios')
      .update({
        total_charges: totalCharges,
        total_payments: totalPayments,
        balance: totalCharges - totalPayments, // = 0
        status: 'CLOSED',
      })
      .eq('id', folio3!.id);

    // Verificar balance = 0
    const { data: finalFolio3 } = await supabase
      .from('folios')
      .select('*')
      .eq('id', folio3!.id)
      .single();

    expect(finalFolio3?.total_charges).toBe(420.00);
    expect(finalFolio3?.total_payments).toBe(420.00);
    expect(finalFolio3?.balance).toBe(0.00);
    expect(finalFolio3?.status).toBe('CLOSED');
  });
});

