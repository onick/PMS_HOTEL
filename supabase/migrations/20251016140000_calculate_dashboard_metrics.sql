-- Función para calcular métricas del dashboard con tendencias mes-sobre-mes
CREATE OR REPLACE FUNCTION get_occupancy_stats(hotel_id_param UUID)
RETURNS JSON AS $$
DECLARE
  current_month_start DATE;
  current_month_end DATE;
  previous_month_start DATE;
  previous_month_end DATE;
  
  current_revenue DECIMAL(10,2);
  previous_revenue DECIMAL(10,2);
  revenue_change DECIMAL(5,2);
  
  current_occupancy DECIMAL(5,2);
  previous_occupancy DECIMAL(5,2);
  occupancy_change DECIMAL(5,2);
  
  current_adr DECIMAL(10,2);
  previous_adr DECIMAL(10,2);
  adr_change DECIMAL(5,2);
  
  current_revpar DECIMAL(10,2);
  previous_revpar DECIMAL(10,2);
  revpar_change DECIMAL(5,2);
  
  total_rooms INT;
  result JSON;
BEGIN
  -- Definir rangos de fechas
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  previous_month_start := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE;
  previous_month_end := (current_month_start - INTERVAL '1 day')::DATE;
  
  -- Obtener número total de habitaciones del hotel
  SELECT COUNT(*) INTO total_rooms
  FROM rooms
  WHERE hotel_id = hotel_id_param AND deleted_at IS NULL;
  
  -- Si no hay habitaciones, retornar datos en cero
  IF total_rooms = 0 THEN
    RETURN json_build_object(
      'revenue', 0,
      'revenueChange', 0,
      'occupancy', 0,
      'occupancyChange', 0,
      'adr', 0,
      'adrChange', 0,
      'revpar', 0,
      'revparChange', 0
    );
  END IF;  
  -- ========== MES ACTUAL ==========
  
  -- Calcular revenue del mes actual
  SELECT COALESCE(SUM(total_amount), 0) INTO current_revenue
  FROM reservations
  WHERE hotel_id = hotel_id_param
    AND status IN ('confirmed', 'checked_in', 'checked_out')
    AND check_in_date >= current_month_start
    AND check_in_date <= current_month_end
    AND deleted_at IS NULL;
  
  -- Calcular occupancy del mes actual
  -- Ocupación = (Room Nights Vendidas / Room Nights Disponibles) * 100
  WITH room_nights AS (
    SELECT 
      COUNT(DISTINCT DATE(gs.date)) * total_rooms as available_nights,
      COUNT(r.id) as sold_nights
    FROM generate_series(
      current_month_start::TIMESTAMP,
      current_month_end::TIMESTAMP,
      '1 day'::INTERVAL
    ) gs(date)
    LEFT JOIN reservations r ON
      r.hotel_id = hotel_id_param
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND gs.date::DATE >= r.check_in_date
      AND gs.date::DATE < r.check_out_date
      AND r.deleted_at IS NULL
  )
  SELECT 
    CASE 
      WHEN available_nights > 0 THEN (sold_nights::DECIMAL / available_nights::DECIMAL) * 100
      ELSE 0
    END INTO current_occupancy
  FROM room_nights;
  
  -- Calcular ADR (Average Daily Rate) del mes actual
  -- ADR = Total Revenue / Room Nights Sold
  WITH adr_calc AS (
    SELECT COUNT(*) as room_nights_sold
    FROM reservations r
    CROSS JOIN generate_series(r.check_in_date, r.check_out_date - INTERVAL '1 day', '1 day'::INTERVAL) as nights
    WHERE r.hotel_id = hotel_id_param
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND r.check_in_date >= current_month_start
      AND r.check_in_date <= current_month_end
      AND r.deleted_at IS NULL
  )
  SELECT 
    CASE 
      WHEN room_nights_sold > 0 THEN current_revenue / room_nights_sold
      ELSE 0
    END INTO current_adr
  FROM adr_calc;
  
  -- Calcular RevPAR (Revenue Per Available Room) del mes actual
  -- RevPAR = Total Revenue / Total Available Rooms
  SELECT 
    CASE 
      WHEN total_rooms > 0 THEN 
        current_revenue / (total_rooms * EXTRACT(DAY FROM current_month_end - current_month_start + INTERVAL '1 day')::INT)
      ELSE 0
    END INTO current_revpar;
  
  -- ========== MES ANTERIOR ==========
  
  -- Calcular revenue del mes anterior
  SELECT COALESCE(SUM(total_amount), 0) INTO previous_revenue
  FROM reservations
  WHERE hotel_id = hotel_id_param
    AND status IN ('confirmed', 'checked_in', 'checked_out')
    AND check_in_date >= previous_month_start
    AND check_in_date <= previous_month_end
    AND deleted_at IS NULL;  
  -- Calcular occupancy del mes anterior
  WITH room_nights AS (
    SELECT 
      COUNT(DISTINCT DATE(gs.date)) * total_rooms as available_nights,
      COUNT(r.id) as sold_nights
    FROM generate_series(
      previous_month_start::TIMESTAMP,
      previous_month_end::TIMESTAMP,
      '1 day'::INTERVAL
    ) gs(date)
    LEFT JOIN reservations r ON
      r.hotel_id = hotel_id_param
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND gs.date::DATE >= r.check_in_date
      AND gs.date::DATE < r.check_out_date
      AND r.deleted_at IS NULL
  )
  SELECT 
    CASE 
      WHEN available_nights > 0 THEN (sold_nights::DECIMAL / available_nights::DECIMAL) * 100
      ELSE 0
    END INTO previous_occupancy
  FROM room_nights;
  
  -- Calcular ADR del mes anterior
  WITH adr_calc AS (
    SELECT COUNT(*) as room_nights_sold
    FROM reservations r
    CROSS JOIN generate_series(r.check_in_date, r.check_out_date - INTERVAL '1 day', '1 day'::INTERVAL) as nights
    WHERE r.hotel_id = hotel_id_param
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND r.check_in_date >= previous_month_start
      AND r.check_in_date <= previous_month_end
      AND r.deleted_at IS NULL
  )
  SELECT 
    CASE 
      WHEN room_nights_sold > 0 THEN previous_revenue / room_nights_sold
      ELSE 0
    END INTO previous_adr
  FROM adr_calc;  
  -- Calcular RevPAR del mes anterior
  SELECT 
    CASE 
      WHEN total_rooms > 0 THEN 
        previous_revenue / (total_rooms * EXTRACT(DAY FROM previous_month_end - previous_month_start + INTERVAL '1 day')::INT)
      ELSE 0
    END INTO previous_revpar;
  
  -- ========== CALCULAR CAMBIOS PORCENTUALES ==========
  
  -- Revenue change
  revenue_change := CASE
    WHEN previous_revenue > 0 THEN 
      ((current_revenue - previous_revenue) / previous_revenue) * 100
    WHEN current_revenue > 0 THEN 100
    ELSE 0
  END;
  
  -- Occupancy change
  occupancy_change := CASE
    WHEN previous_occupancy > 0 THEN 
      ((current_occupancy - previous_occupancy) / previous_occupancy) * 100
    WHEN current_occupancy > 0 THEN 100
    ELSE 0
  END;
  
  -- ADR change
  adr_change := CASE
    WHEN previous_adr > 0 THEN 
      ((current_adr - previous_adr) / previous_adr) * 100
    WHEN current_adr > 0 THEN 100
    ELSE 0
  END;
  
  -- RevPAR change
  revpar_change := CASE
    WHEN previous_revpar > 0 THEN 
      ((current_revpar - previous_revpar) / previous_revpar) * 100
    WHEN current_revpar > 0 THEN 100
    ELSE 0
  END;  
  -- ========== CONSTRUIR RESPUESTA JSON ==========
  
  result := json_build_object(
    'revenue', ROUND(current_revenue, 2),
    'revenueChange', ROUND(revenue_change, 2),
    'occupancy', ROUND(current_occupancy, 2),
    'occupancyChange', ROUND(occupancy_change, 2),
    'adr', ROUND(current_adr, 2),
    'adrChange', ROUND(adr_change, 2),
    'revpar', ROUND(current_revpar, 2),
    'revparChange', ROUND(revpar_change, 2)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar comentario descriptivo
COMMENT ON FUNCTION get_occupancy_stats(UUID) IS 
'Calcula métricas del dashboard (Revenue, Occupancy, ADR, RevPAR) con cambios porcentuales mes-sobre-mes para un hotel específico';

-- Garantizar permisos para usuarios autenticados
GRANT EXECUTE ON FUNCTION get_occupancy_stats(UUID) TO authenticated;
