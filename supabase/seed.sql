-- =====================================================
-- SEED DATA PARA DESARROLLO LOCAL
-- =====================================================
-- Este script crea datos de prueba para facilitar el desarrollo
-- IMPORTANTE: Solo ejecutar en desarrollo, nunca en producción
-- =====================================================

-- 1. Crear usuario de prueba (debe hacerse manualmente desde Supabase Auth)
-- Email: admin@hotelmate.test
-- Password: Admin123456!
-- Luego obtener el UUID del usuario y reemplazar aquí

-- Para efectos de este script, usaremos un UUID de ejemplo
-- Reemplaza 'YOUR_USER_ID_HERE' con tu UUID real después de crear el usuario

DO $$
DECLARE
  v_hotel_id UUID;
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- REEMPLAZAR con tu user ID real
  v_room_type_standard UUID;
  v_room_type_deluxe UUID;
  v_room_type_suite UUID;
  v_guest_1 UUID;
  v_guest_2 UUID;
  v_guest_3 UUID;
  v_reservation_1 UUID;
  v_reservation_2 UUID;
  v_reservation_3 UUID;
BEGIN

-- =====================================================
-- 2. CREAR HOTEL
-- =====================================================
INSERT INTO hotels (
  name,
  address,
  city,
  state,
  country,
  postal_code,
  phone,
  email,
  website,
  currency,
  timezone,
  tax_rate,
  check_in_time,
  check_out_time
) VALUES (
  'Hotel Playa Paraíso',
  'Calle Principal #123',
  'Pedernales',
  'Pedernales',
  'República Dominicana',  '18004',
  '+1 (809) 555-0100',
  'info@playaparaiso.do',
  'https://playaparaiso.do',
  'DOP',
  'America/Santo_Domingo',
  18.00,
  '15:00:00',
  '12:00:00'
) RETURNING id INTO v_hotel_id;

RAISE NOTICE 'Hotel creado con ID: %', v_hotel_id;

-- =====================================================
-- 3. CREAR TIPOS DE HABITACIÓN
-- =====================================================
INSERT INTO room_types (hotel_id, name, description, base_price, max_occupancy, amenities)
VALUES 
  (v_hotel_id, 'Estándar', 'Habitación estándar con vista al jardín', 250000, 2, ARRAY['wifi', 'tv', 'ac']),
  (v_hotel_id, 'Deluxe', 'Habitación deluxe con balcón y vista al mar', 450000, 3, ARRAY['wifi', 'tv', 'ac', 'balcony', 'ocean_view']),
  (v_hotel_id, 'Suite', 'Suite de lujo con jacuzzi y vista panorámica', 850000, 4, ARRAY['wifi', 'tv', 'ac', 'balcony', 'ocean_view', 'jacuzzi', 'minibar'])
RETURNING id INTO v_room_type_standard, v_room_type_deluxe, v_room_type_suite;

RAISE NOTICE 'Tipos de habitación creados';

-- =====================================================
-- 4. CREAR HABITACIONES
-- =====================================================
-- Habitaciones Estándar (101-110)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT v_hotel_id, v_room_type_standard, '1' || LPAD(i::text, 2, '0'), 1, 'available'
FROM generate_series(1, 10) i;
-- Habitaciones Deluxe (201-205)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT v_hotel_id, v_room_type_deluxe, '2' || LPAD(i::text, 2, '0'), 2, 'available'
FROM generate_series(1, 5) i;

-- Habitaciones Suite (301-303)
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT v_hotel_id, v_room_type_suite, '3' || LPAD(i::text, 2, '0'), 3, 'available'
FROM generate_series(1, 3) i;

RAISE NOTICE '18 habitaciones creadas';

-- =====================================================
-- 5. CREAR HUÉSPEDES DE PRUEBA
-- =====================================================
INSERT INTO guests (hotel_id, name, email, phone, document_type, document_number, nationality, address, city, country)
VALUES 
  (v_hotel_id, 'Juan Pérez García', 'juan.perez@example.com', '+1 (809) 555-1001', 'passport', 'AB123456', 'Dominican Republic', 'Calle Luna 45', 'Santo Domingo', 'República Dominicana'),
  (v_hotel_id, 'María González López', 'maria.gonzalez@example.com', '+1 (809) 555-1002', 'cedula', '001-1234567-8', 'Dominican Republic', 'Av. Independencia 123', 'Santiago', 'República Dominicana'),
  (v_hotel_id, 'Carlos Rodríguez', 'carlos.rodriguez@example.com', '+1 (829) 555-1003', 'passport', 'CD789012', 'United States', '789 Ocean Ave', 'Miami', 'United States')
RETURNING id INTO v_guest_1, v_guest_2, v_guest_3;

RAISE NOTICE '3 huéspedes creados';

-- =====================================================
-- 6. CREAR RESERVACIONES
-- =====================================================
-- Reservación 1: Confirmada (mes actual)
INSERT INTO reservations (
  hotel_id, guest_id, room_type_id,
  check_in, check_out, guests,
  status, source, total_amount_cents, notes
) VALUES (
  v_hotel_id, v_guest_1, v_room_type_deluxe,
  CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', 2,
  'CONFIRMED', 'direct', 180000000,
  'Solicita habitación con vista al mar'
) RETURNING id INTO v_reservation_1;
-- Reservación 2: Checked In (actual)
INSERT INTO reservations (
  hotel_id, guest_id, room_type_id,
  check_in, check_out, guests,
  status, source, total_amount_cents, notes
) VALUES (
  v_hotel_id, v_guest_2, v_room_type_standard,
  CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 2,
  'CONFIRMED', 'booking_com', 100000000,
  'Llegada temprana confirmada'
) RETURNING id INTO v_reservation_2;

-- Reservación 3: Reserva del mes pasado (para tendencias)
INSERT INTO reservations (
  hotel_id, guest_id, room_type_id,
  check_in, CURRENT_DATE - INTERVAL '25 days', check_out, CURRENT_DATE - INTERVAL '22 days', guests, 2,
  status, 'CONFIRMED', source, 'direct', total_amount_cents, 255000000,
  notes, 'Cliente frecuente'
) RETURNING id INTO v_reservation_3;

RAISE NOTICE '3 reservaciones creadas';

-- =====================================================
-- 7. CREAR FOLIOS
-- =====================================================
INSERT INTO folios (reservation_id, balance, currency, status)
VALUES 
  (v_reservation_1, 180000000, 'DOP', 'open'),
  (v_reservation_2, 100000000, 'DOP', 'open'),
  (v_reservation_3, 0, 'DOP', 'closed');

RAISE NOTICE 'Folios creados';

-- =====================================================
-- 8. INICIALIZAR INVENTARIO
-- =====================================================
-- Crear inventario para los próximos 365 días
INSERT INTO inventory_by_day (hotel_id, room_type_id, date, total_inventory, reserved, holds)
SELECT 
  v_hotel_id,
  rt.id,
  generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', '1 day')::date,
  (SELECT COUNT(*) FROM rooms WHERE room_type_id = rt.id),
  0,
  0
FROM room_types rt
WHERE rt.hotel_id = v_hotel_id;

RAISE NOTICE 'Inventario inicializado para 365 días';

-- =====================================================
-- 9. RESUMEN
-- =====================================================
RAISE NOTICE '========================================';
RAISE NOTICE 'SEED DATA COMPLETADO EXITOSAMENTE';
RAISE NOTICE '========================================';
RAISE NOTICE 'Hotel ID: %', v_hotel_id;
RAISE NOTICE 'Total habitaciones: 18 (10 Estándar, 5 Deluxe, 3 Suites)';
RAISE NOTICE 'Total huéspedes: 3';
RAISE NOTICE 'Total reservaciones: 3';
RAISE NOTICE '========================================';
RAISE NOTICE 'PRÓXIMOS PASOS:';
RAISE NOTICE '1. Crear usuario en Supabase Auth';
RAISE NOTICE '2. Reemplazar YOUR_USER_ID_HERE con tu UUID';
RAISE NOTICE '3. Ejecutar este script nuevamente';
RAISE NOTICE '========================================';

END $$;
