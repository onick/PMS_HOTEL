import { supabase } from './auth.helper';

/**
 * Helper para crear un hotel de prueba
 */
export async function createTestHotel(name: string, ownerId: string) {
  const { data, error } = await supabase
    .from('hotels')
    .insert({
      name,
      owner_id: ownerId,
      address: '123 Test Street',
      city: 'Test City',
      country: 'Test Country',
      phone: '+1234567890',
      email: `${name.toLowerCase().replace(/\s/g, '')}@test.com`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper para crear una habitación de prueba
 */
export async function createTestRoom(hotelId: string, roomNumber: string, roomTypeId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      hotel_id: hotelId,
      room_number: roomNumber,
      room_type_id: roomTypeId,
      status: 'CLEAN',
      floor: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper para crear una reserva de prueba
 */
export async function createTestReservation(hotelId: string, guestId: string) {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 2); // 2 noches

  const { data, error } = await supabase
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

  if (error) throw error;
  return data;
}

/**
 * Helper para crear un huésped de prueba
 */
export async function createTestGuest(hotelId: string, email: string) {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      first_name: 'Test',
      last_name: 'Guest',
      email,
      phone: '+1234567890',
      document_type: 'PASSPORT',
      document_number: 'TEST123456',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper para limpiar datos de prueba
 */
export async function cleanupTestData(hotelId: string) {
  // Eliminar en orden correcto (respetando foreign keys)
  await supabase.from('reservations').delete().eq('hotel_id', hotelId);
  await supabase.from('guests').delete().eq('hotel_id', hotelId);
  await supabase.from('rooms').delete().eq('hotel_id', hotelId);
  await supabase.from('hotels').delete().eq('id', hotelId);
}
