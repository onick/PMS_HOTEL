-- Función para actualizar el balance de un folio
CREATE OR REPLACE FUNCTION update_folio_balance(
  p_folio_id uuid,
  p_amount_cents bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE folios
  SET balance_cents = balance_cents + p_amount_cents
  WHERE id = p_folio_id;
END;
$$;

-- Función para incrementar/decrementar inventory reserved
CREATE OR REPLACE FUNCTION increment_inventory_reserved(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_day date,
  p_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory_by_day
  SET reserved = reserved + p_delta
  WHERE hotel_id = p_hotel_id
    AND room_type_id = p_room_type_id
    AND day = p_day;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory row not found for hotel_id: %, room_type_id: %, day: %',
      p_hotel_id, p_room_type_id, p_day;
  END IF;
END;
$$;
