-- Arreglar search_path en funciones
CREATE OR REPLACE FUNCTION increment_inventory_holds(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_day date,
  p_delta int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inventory_by_day
  SET holds = holds + p_delta
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND day = p_day;
END;
$$;

CREATE OR REPLACE FUNCTION increment_inventory_reserved(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_day date,
  p_delta int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inventory_by_day
  SET reserved = reserved + p_delta
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND day = p_day;
END;
$$;

-- Habilitar RLS en tablas faltantes
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_locks ENABLE ROW LEVEL SECURITY;

-- Políticas para idempotency_keys (solo backend)
CREATE POLICY "Service role only" ON idempotency_keys FOR ALL USING (false);

-- Políticas para room_locks
CREATE POLICY "Hotel staff can view room locks" ON room_locks 
  FOR SELECT USING (has_hotel_access(auth.uid(), hotel_id));