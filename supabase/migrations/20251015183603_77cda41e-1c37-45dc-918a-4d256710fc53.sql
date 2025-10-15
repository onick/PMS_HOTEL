-- Funciones para incrementar/decrementar inventario de forma atómica

CREATE OR REPLACE FUNCTION increment_inventory_holds(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_day date,
  p_delta int
)
RETURNS void
LANGUAGE plpgsql
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
AS $$
BEGIN
  UPDATE inventory_by_day
  SET reserved = reserved + p_delta
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND day = p_day;
END;
$$;