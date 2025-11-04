-- =====================================================
-- SEED DATA FOR REVENUE MANAGEMENT
-- Datos de ejemplo para probar el sistema
-- =====================================================

-- Insertar historial de precios para los últimos 30 días
-- Nota: Este script usa la función gen_random_uuid() para hotel_id y room_type_id
-- En producción, deberás ajustar estos valores según tus datos reales

DO $$
DECLARE
  v_hotel_id uuid;
  v_room_type_id uuid;
  v_date date;
  v_price int;
  v_base_price int := 485000; -- $4,850 base price in cents
BEGIN
  -- Obtener el primer hotel y room_type (ajusta según tus necesidades)
  SELECT id INTO v_hotel_id FROM hotels LIMIT 1;
  SELECT id INTO v_room_type_id FROM room_types WHERE hotel_id = v_hotel_id LIMIT 1;

  -- Solo continuar si encontramos hotel y room_type
  IF v_hotel_id IS NOT NULL AND v_room_type_id IS NOT NULL THEN
    
    -- Insertar historial de precios para los últimos 30 días
    FOR i IN 0..29 LOOP
      v_date := CURRENT_DATE - i;
      
      -- Variar el precio según el día de la semana
      -- Fines de semana más caros
      IF EXTRACT(DOW FROM v_date) IN (5, 6) THEN -- Viernes y Sábado
        v_price := v_base_price + (RANDOM() * 50000)::int + 20000; -- +$200-$700
      ELSIF EXTRACT(DOW FROM v_date) = 0 THEN -- Domingo
        v_price := v_base_price + (RANDOM() * 30000)::int + 10000; -- +$100-$400
      ELSE -- Días de semana
        v_price := v_base_price + (RANDOM() * 20000)::int - 10000; -- -$100 a +$100
      END IF;

      -- Insertar en rate_history
      INSERT INTO rate_history (hotel_id, room_type_id, date, price_cents, source, occupancy_percent)
      VALUES (
        v_hotel_id,
        v_room_type_id,
        v_date,
        v_price,
        'AUTOMATIC',
        30 + (RANDOM() * 50)::numeric(5,2) -- Ocupación entre 30% y 80%
      )
      ON CONFLICT (hotel_id, room_type_id, date, rate_plan_id) DO NOTHING;
    END LOOP;

    -- Insertar datos de competidores
    FOR i IN 0..29 LOOP
      v_date := CURRENT_DATE - i;
      
      -- Competidor 1: "Hotel Tropical Paradise"
      IF EXTRACT(DOW FROM v_date) IN (5, 6) THEN
        v_price := v_base_price + (RANDOM() * 60000)::int + 30000; -- Más caro
      ELSE
        v_price := v_base_price + (RANDOM() * 30000)::int + 10000;
      END IF;
      
      INSERT INTO competitor_rates (hotel_id, competitor_name, date, room_category, price_cents, source)
      VALUES (
        v_hotel_id,
        'Hotel Tropical Paradise',
        v_date,
        'Standard Double',
        v_price,
        'MANUAL'
      );

      -- Competidor 2: "Beach Resort & Spa"
      IF EXTRACT(DOW FROM v_date) IN (5, 6) THEN
        v_price := v_base_price + (RANDOM() * 70000)::int + 40000;
      ELSE
        v_price := v_base_price + (RANDOM() * 35000)::int + 15000;
      END IF;
      
      INSERT INTO competitor_rates (hotel_id, competitor_name, date, room_category, price_cents, source)
      VALUES (
        v_hotel_id,
        'Beach Resort & Spa',
        v_date,
        'Standard Room',
        v_price,
        'MANUAL'
      );
    END LOOP;

    RAISE NOTICE 'Revenue data seeded successfully for hotel_id: %', v_hotel_id;
  ELSE
    RAISE NOTICE 'No hotel or room_type found. Skipping seed data.';
  END IF;
END $$;
