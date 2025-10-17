-- Función para auto-crear inventario cuando se crea un room_type
CREATE OR REPLACE FUNCTION auto_create_inventory_for_room_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear inventario para los próximos 365 días
  INSERT INTO inventory_by_day (hotel_id, room_type_id, day, total)
  SELECT 
    NEW.hotel_id,
    NEW.id,
    CURRENT_DATE + (n || ' days')::interval,
    0  -- Inicialmente 0, el hotel debe actualizar según las habitaciones físicas creadas
  FROM generate_series(0, 365) n
  ON CONFLICT (hotel_id, room_type_id, day) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger para ejecutar la función cuando se inserta un room_type
DROP TRIGGER IF EXISTS on_room_type_created ON room_types;
CREATE TRIGGER on_room_type_created
  AFTER INSERT ON room_types
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_inventory_for_room_type();

-- Función para actualizar inventario total cuando se crean/modifican rooms
CREATE OR REPLACE FUNCTION update_inventory_total_for_room_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_rooms int;
BEGIN
  -- Contar habitaciones del tipo
  SELECT COUNT(*)
  INTO v_total_rooms
  FROM rooms
  WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    AND room_type_id = COALESCE(NEW.room_type_id, OLD.room_type_id)
    AND status IN ('AVAILABLE', 'OCCUPIED');  -- Excluir MAINTENANCE y BLOCKED
  
  -- Actualizar inventario para los próximos 365 días
  UPDATE inventory_by_day
  SET total = v_total_rooms
  WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    AND room_type_id = COALESCE(NEW.room_type_id, OLD.room_type_id)
    AND day >= CURRENT_DATE
    AND day <= CURRENT_DATE + INTERVAL '365 days';
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para ejecutar cuando se inserta/actualiza/elimina una room
DROP TRIGGER IF EXISTS on_room_changed ON rooms;
CREATE TRIGGER on_room_changed
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_total_for_room_type();

-- Poblar inventario para room_types existentes que no tienen inventario
INSERT INTO inventory_by_day (hotel_id, room_type_id, day, total)
SELECT 
  rt.hotel_id,
  rt.id,
  CURRENT_DATE + (n || ' days')::interval,
  COALESCE(
    (SELECT COUNT(*) 
     FROM rooms r 
     WHERE r.hotel_id = rt.hotel_id 
       AND r.room_type_id = rt.id 
       AND r.status IN ('AVAILABLE', 'OCCUPIED')),
    0
  )
FROM room_types rt
CROSS JOIN generate_series(0, 365) n
ON CONFLICT (hotel_id, room_type_id, day) DO UPDATE
SET total = EXCLUDED.total
WHERE inventory_by_day.day >= CURRENT_DATE;

-- Comentario explicativo
COMMENT ON FUNCTION auto_create_inventory_for_room_type() IS 
  'Automáticamente crea filas de inventario para 365 días cuando se crea un nuevo tipo de habitación';
  
COMMENT ON FUNCTION update_inventory_total_for_room_type() IS 
  'Automáticamente actualiza el total de inventario basado en el número de habitaciones físicas disponibles';
