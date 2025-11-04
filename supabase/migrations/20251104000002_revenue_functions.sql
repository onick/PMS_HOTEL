-- =====================================================
-- REVENUE MANAGEMENT FUNCTIONS
-- =====================================================

-- Función para calcular la tarifa óptima sugerida
CREATE OR REPLACE FUNCTION calculate_optimal_rate(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_price_cents int;
  v_competitor_avg_cents int;
  v_occupancy_percent numeric;
  v_optimal_price_cents int;
  v_current_price_cents int;
  v_opportunities int;
  v_result jsonb;
BEGIN
  -- Obtener precio base del room_type
  SELECT base_price_cents INTO v_base_price_cents
  FROM room_types
  WHERE id = p_room_type_id AND hotel_id = p_hotel_id;

  IF v_base_price_cents IS NULL THEN
    RETURN jsonb_build_object('error', 'Room type not found');
  END IF;

  -- Calcular promedio de competidores para esa fecha
  SELECT AVG(price_cents)::int INTO v_competitor_avg_cents
  FROM competitor_rates
  WHERE hotel_id = p_hotel_id
    AND date = p_date;

  -- Si no hay datos de competidores, usar precio base
  v_competitor_avg_cents := COALESCE(v_competitor_avg_cents, v_base_price_cents);

  -- Calcular ocupación actual
  SELECT 
    CASE 
      WHEN total > 0 THEN (reserved::numeric / total::numeric) * 100
      ELSE 0
    END INTO v_occupancy_percent
  FROM inventory_by_day
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND day = p_date;

  v_occupancy_percent := COALESCE(v_occupancy_percent, 0);

  -- Obtener precio actual del rate_history
  SELECT price_cents INTO v_current_price_cents
  FROM rate_history
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND date = p_date
  ORDER BY created_at DESC
  LIMIT 1;

  v_current_price_cents := COALESCE(v_current_price_cents, v_base_price_cents);

  -- Algoritmo de pricing dinámico
  -- 70% basado en competidores, 30% en ocupación
  -- Si ocupación > 80%, incrementar precio
  -- Si ocupación < 30%, disminuir precio
  
  IF v_occupancy_percent > 80 THEN
    -- Alta ocupación: incrementar 10-20%
    v_optimal_price_cents := v_competitor_avg_cents * 1.15;
  ELSIF v_occupancy_percent > 60 THEN
    -- Buena ocupación: precio competitivo
    v_optimal_price_cents := v_competitor_avg_cents * 1.05;
  ELSIF v_occupancy_percent > 30 THEN
    -- Ocupación media: seguir al mercado
    v_optimal_price_cents := v_competitor_avg_cents;
  ELSE
    -- Baja ocupación: ser más agresivo
    v_optimal_price_cents := v_competitor_avg_cents * 0.95;
  END IF;

  -- Limitar entre 80% y 150% del precio base
  v_optimal_price_cents := GREATEST(v_optimal_price_cents, v_base_price_cents * 0.8);
  v_optimal_price_cents := LEAST(v_optimal_price_cents, v_base_price_cents * 1.5);

  -- Contar oportunidades (habitaciones por debajo del mercado)
  SELECT COUNT(*)::int INTO v_opportunities
  FROM rate_history rh
  WHERE rh.hotel_id = p_hotel_id
    AND rh.date = p_date
    AND rh.price_cents < (v_competitor_avg_cents * 0.90);

  -- Construir resultado
  v_result := jsonb_build_object(
    'optimal_price_cents', v_optimal_price_cents,
    'current_price_cents', v_current_price_cents,
    'difference_cents', v_optimal_price_cents - v_current_price_cents,
    'competitor_avg_cents', v_competitor_avg_cents,
    'occupancy_percent', v_occupancy_percent,
    'opportunities', v_opportunities,
    'base_price_cents', v_base_price_cents
  );

  RETURN v_result;
END;
$$;
